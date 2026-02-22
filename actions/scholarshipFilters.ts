"use server";

import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";

export async function getEligibleScholarships(profile: any) {
  await connectToDatabase();

  // No profile → show the 50 newest scholarships
  if (!profile) {
    return await Scholarship.find().sort({ createdAt: -1 }).limit(50).lean();
  }

  // With profile → run eligibility pipeline
  // Treat maxIncome=0 and minCGPA=0 as "no restriction" (open to all)
  const pipeline = [
    {
      $match: {
        $and: [
          // 1. CGPA: scholarship minCGPA <= user's CGPA OR no/zero limit
          {
            $or: [
              { minCGPA: { $exists: false } },
              { minCGPA: null },
              { minCGPA: 0 },
              { minCGPA: { $lte: profile.cgpa } },
            ],
          },

          // 2. Income: scholarship maxIncome >= user's income OR no/zero limit
          {
            $or: [
              { maxIncome: { $exists: false } },
              { maxIncome: null },
              { maxIncome: 0 },
              ...(profile.income != null
                ? [{ maxIncome: { $gte: profile.income } }]
                : []),
            ],
          },

          // 3. Category: matches user's category OR no restriction
          {
            $or: [
              { categoryRestriction: { $exists: false } },
              { categoryRestriction: null },
              { categoryRestriction: "" },
              ...(profile.category
                ? [
                  {
                    $expr: {
                      $regexMatch: {
                        input: "$categoryRestriction",
                        regex: profile.category,
                        options: "i",
                      },
                    },
                  },
                ]
                : []),
            ],
          },
        ],
      },
    },
    { $sort: { amount: -1, createdAt: -1 } },
    { $limit: 50 },
  ];

  const results = await Scholarship.aggregate(pipeline as any[]);
  return JSON.parse(JSON.stringify(results));
}