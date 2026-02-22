"use server";

import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";

export async function getEligibleScholarships(profile: any) {
  await connectToDatabase();

  // If user hasn't filled a profile yet, just show the 20 newest scholarships
  if (!profile) {
    return await Scholarship.find().sort({ createdAt: -1 }).limit(20).lean();
  }

  // 🔥 High-Performance MongoDB Pipeline
  const pipeline = [
    {
      $match: {
        $and: [
          // 1. CGPA Check: Scholarship minCGPA <= user's CGPA (or no limit exists)
          { $or: [{ minCGPA: { $lte: profile.cgpa } }, { minCGPA: { $exists: false } }, { minCGPA: null }] },
          
          // 2. Income Check: Scholarship maxIncome >= user's income (or no limit exists)
          { $or: [{ maxIncome: { $gte: profile.income } }, { maxIncome: { $exists: false } }, { maxIncome: null }] },
          
          // 3. Category Check: Matches "General", "OBC", etc.
          {
            $or: [
              { categoryRestriction: { $exists: false } },
              { categoryRestriction: null },
              { categoryRestriction: "" },
              {
                $expr: {
                  $regexMatch: {
                    input: "$categoryRestriction",
                    regex: profile.category,
                    options: "i"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    { $sort: { amount: -1 } } // Show highest paying scholarships first
  ];

  const results = await Scholarship.aggregate(pipeline as any[]);
  return JSON.parse(JSON.stringify(results));
}