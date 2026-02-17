"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";
import Scholarship from "@/models/Scholarship";
import dbConnect from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 1️⃣ Eligibility Explanation
export async function generateEligibilityExplanation(scholarshipId: string) {
  await dbConnect();

  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await User.findOne({ clerkId: userId });
  const scholarship = await Scholarship.findById(scholarshipId);

  const prompt = `
  Student Profile:
  CGPA: ${user.cgpa}
  Income: ${user.income}

  Scholarship:
  Title: ${scholarship.title}
  Minimum CGPA: ${scholarship.minCGPA}
  Maximum Income: ${scholarship.maxIncome}

  Explain clearly whether the student is eligible and why.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// 2️⃣ SOP Generator
export async function generateSOP(scholarshipId: string) {
  await dbConnect();

  const { userId } = auth();
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