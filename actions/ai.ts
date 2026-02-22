"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";
import Scholarship from "@/models/Scholarship";
import { connectToDatabase } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 1️⃣ Eligibility Explanation
export async function generateEligibilityExplanation(scholarshipId: string) {
  await connectToDatabase();

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    throw new Error("User profile not found. Please complete onboarding.");
  }

  const scholarship = await Scholarship.findById(scholarshipId);
  if (!scholarship) {
    throw new Error("Scholarship not found.");
  }

  // 🔥 STEP 1: Deterministic Eligibility Logic
  const hasCGPARequirement = typeof scholarship.minCGPA === "number";
  const hasIncomeRequirement = typeof scholarship.maxIncome === "number";

  const isCGPAEligible = hasCGPARequirement
    ? user.cgpa >= scholarship.minCGPA
    : true;

  const isIncomeEligible = hasIncomeRequirement
    ? user.income <= scholarship.maxIncome
    : true;

  const isEligible = isCGPAEligible && isIncomeEligible;

  const cgpaGap = hasCGPARequirement
    ? scholarship.minCGPA - user.cgpa
    : 0;

  const incomeGap = hasIncomeRequirement
    ? user.income - scholarship.maxIncome
    : 0;


  const verdict = isEligible ? "Eligible" : "Not Eligible";

  // 🔥 STEP 2: AI Only For Explanation
  const prompt = `
        You are an academic scholarship eligibility evaluation assistant.

        The final eligibility verdict has already been determined by the system.

        Final Verdict: ${verdict}

        Student Profile:
        - CGPA: ${user.cgpa}
        - Family Income: ${user.income}

        Scholarship Criteria:
        - Minimum CGPA Required: ${scholarship.minCGPA ?? "Not Specified"}
        - Maximum Income Allowed: ${scholarship.maxIncome ?? "Not Specified"}

        Comparison Results:
        - CGPA Evaluation: ${isCGPAEligible
      ? "Requirement Met"
      : `Below Requirement by ${Math.abs(cgpaGap).toFixed(2)}`
    }
        - Income Evaluation: ${isIncomeEligible
      ? "Within Allowed Limit"
      : `Exceeds Limit by ${Math.abs(incomeGap)}`
    }

        Instructions:
        - Clearly state whether the student is Eligible or Not Eligible.
        - If Not Eligible, explain which requirement failed.
        - If Eligible, briefly explain how both requirements are satisfied.
        - Do NOT introduce new criteria.
        - Do NOT hallucinate missing rules.
        - Keep the explanation professional and concise (5-6 sentences).
    `;

  const result = await model.generateContent(prompt);
  const explanation = result.response.text();

  // 🔥 Optional: Add confidence score
  const confidence = hasCGPARequirement && hasIncomeRequirement
    ? 100
    : 60;

  return {
    verdict,
    confidence,
    cgpaStatus: isCGPAEligible,
    incomeStatus: isIncomeEligible,
    explanation
  };
}


// 2️⃣ SOP Generator (legacy - kept for compatibility)
export async function generateSOP(scholarshipId: string) {
  await connectToDatabase();

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await User.findOne({ clerkId: userId });
  const scholarship = await Scholarship.findById(scholarshipId);

  const prompt = `
  Write a professional 300-word Statement of Purpose.

  Student:
  CGPA: ${user.cgpa}
  Family Income: ${user.income}

  Applying for: ${scholarship.title}
  Description: ${scholarship.description}

  Focus on academic merit and financial need.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 3️⃣ SOP Generator with user answers (Application Designer)
export async function generateSOPWithAnswers({
  scholarshipId,
  careerGoal,
  whyFunding,
  challenge,
}: {
  scholarshipId: string;
  careerGoal: string;
  whyFunding: string;
  challenge: string;
}) {
  await connectToDatabase();

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const scholarship = await Scholarship.findById(scholarshipId);
  let userContext = "";
  try {
    const user = await User.findOne({ clerkId: userId });
    if (user) {
      userContext = `Student CGPA: ${user.cgpa ?? "N/A"}, Family Income: ₹${user.income ?? "N/A"}`;
    }
  } catch { }

  // Use MegaLLM via OpenAI SDK
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    baseURL: "https://ai.megallm.io/v1",
    apiKey: process.env.MEGALLM_API_KEY!,
  });

  const prompt = `You are an expert scholarship application writer. Write a compelling, personalized 350-word Statement of Purpose (SOP) for the following scholarship application.

Scholarship: ${scholarship?.title ?? scholarshipId}
Provider: ${scholarship?.provider ?? ""}
${scholarship?.description ? `Description: ${scholarship.description}` : ""}
${userContext}

The student provided the following answers:

1. Core Career Goal: "${careerGoal}"
2. Why They Need This Funding: "${whyFunding}"
3. A Recent Challenge They Overcame: "${challenge}"

Instructions:
- Write in first person, with a warm yet professional tone
- Start with a strong opening hook related to their career goal
- Weave in their financial need naturally (do not make it sound desperate)
- Reference the specific scholarship name and provider
- Include the challenge as evidence of their resilience
- End with a confident closing about their future contributions
- Keep it between 320–380 words
- Do NOT use placeholder text or brackets
- Output ONLY the SOP text, no headers or labels`;

  const response = await client.chat.completions.create({
    model: process.env.MEGALLM_MODEL ?? "deepseek-ai/deepseek-v3.1",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content ?? "Could not generate SOP. Please try again.";
}

