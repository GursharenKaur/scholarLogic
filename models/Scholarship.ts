import mongoose, { Schema, Document, Model } from "mongoose";

// this is just an interface we have made 
export interface IScholarship extends Document {

  // student details 
  title: string;
  provider: string;
  amount?: number;
  amountType?: "CASH" | "WAIVER";
  deadline: Date;
  location: string;

  // ye AI leke ayega M3 da kaam ae eh
  educationLevel: string;
  maxIncome?: number;
  minCGPA?: number;

  // New restriction fields
  courseRestriction?: string;
  categoryRestriction?: string;
  yearRestriction?: string;

  // Deduplication keys (normalized lowercase)
  normTitle?: string;
  normProvider?: string;

  // metadata
  applyLink?: string;
  description?: string;
  tags: string[];
  sourcePdf?: string; // New field to store the source PDF filename
  createdAt: Date;
}


// 2. Mongoose Schema
// This will tell MongoDB how to store the data
const ScholarshipSchema = new Schema<IScholarship>(
  {
    title: { type: String, required: true },
    provider: { type: String, required: true },
    amount: { type: Number },
    amountType: { type: String, enum: ["CASH", "WAIVER"] },
    deadline: { type: Date },
    location: { type: String, default: "Pan-India" },
    educationLevel: { type: String, default: "Any" },
    maxIncome: { type: Number },
    minCGPA: { type: Number },
    courseRestriction: { type: String },
    categoryRestriction: { type: String },
    yearRestriction: { type: String },
    applyLink: { type: String },
    description: { type: String },
    tags: { type: [String], default: [] },
    sourcePdf: { type: String },
    // Deduplication keys
    normTitle: { type: String, index: true },
    normProvider: { type: String, index: true },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// 3. The Model Export (Singleton Pattern)
// This prevents "OverwriteModelError" in Next.js
const Scholarship: Model<IScholarship> =
  mongoose.models.Scholarship || mongoose.model<IScholarship>("Scholarship", ScholarshipSchema);

export default Scholarship;