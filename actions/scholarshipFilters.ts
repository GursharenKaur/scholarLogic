"use server";

import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";

export async function getIneligibilityReasons(scholarship: any, profile: any): Promise<string[]> {
  const reasons: string[] = [];
  
  // Check CGPA
  if (scholarship.minCGPA && scholarship.minCGPA > 0 && profile.cgpa < scholarship.minCGPA) {
    reasons.push(`CGPA too low (required: ${scholarship.minCGPA}, yours: ${profile.cgpa})`);
  }
  
  // Check Income
  if (scholarship.maxIncome && scholarship.maxIncome > 0 && profile.income > scholarship.maxIncome) {
    reasons.push(`Income too high (max: ₹${scholarship.maxIncome.toLocaleString("en-IN")}, yours: ₹${profile.income.toLocaleString("en-IN")})`);
  }
  
  // Check Category
  if (scholarship.categoryRestriction && scholarship.categoryRestriction.trim() && profile.category) {
    const categoryMatch = scholarship.categoryRestriction.toLowerCase().includes(profile.category.toLowerCase()) ||
                         profile.category.toLowerCase().includes(scholarship.categoryRestriction.toLowerCase());
    if (!categoryMatch) {
      reasons.push(`Category mismatch (required: ${scholarship.categoryRestriction}, yours: ${profile.category})`);
    }
  }
  
  return reasons;
}

export async function getEligibleScholarships(profile: any) {
  await connectToDatabase();

  // No profile → show the 50 newest scholarships without eligibility status
  if (!profile) {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 }).limit(50).lean();
    return scholarships.map((s: any) => ({
      ...s,
      isEligible: undefined,
      ineligibilityReasons: []
    }));
  }

  // With profile → get all scholarships and determine eligibility
  const allScholarships = await Scholarship.find().sort({ amount: -1, createdAt: -1 }).lean();
  
  const results = await Promise.all(allScholarships.map(async (scholarship: any) => {
    const reasons = await getIneligibilityReasons(scholarship, profile);
    return {
      ...scholarship,
      isEligible: reasons.length === 0,
      ineligibilityReasons: reasons
    };
  }));
  
  return results;
}