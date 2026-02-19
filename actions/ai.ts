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
        - CGPA Evaluation: ${
          isCGPAEligible
            ? "Requirement Met"
            : `Below Requirement by ${Math.abs(cgpaGap).toFixed(2)}`
        }
        - Income Evaluation: ${
          isIncomeEligible
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


// 2️⃣ SOP Generator
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