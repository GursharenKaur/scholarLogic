import mongoose , { Schema , Document , Model} from "mongoose";

// this is just an interface we have made 
export interface IScholarship extends Document{

    // student details 
    title: string;
    provider: string;
    amount: number;
    deadline: Date;
    location: string;

    // ye AI leke ayega M3 da kaam ae eh
    educationLevel: string;
    minIncome?: number;
    minCGPA?: number;

    // metadata
    applyLink: string;
    description: string;
    tags: string[];
    createdAt: Date;
}


// 2. Mongoose Schema
// This will tell MongoDB how to store the data
const ScholarshipSchema = new Schema<IScholarship>(
  {
    title: { type: String, required: true },
    provider: { type: String, required: true },
    amount: { type: Number, required: true },
    deadline: { type: Date, required: true },
    location: { type: String, default: "Pan-India" },
    
    educationLevel: { type: String, default: "Any" },
    minIncome: { type: Number }, // optional thats why we used question mark in interface
    minCGPA: { type: Number },   // Optional
    
    applyLink: { type: String, required: true },
    description: { type: String },
    tags: { type: [String], default: [] },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// 3. The Model Export (Singleton Pattern)
// This prevents "OverwriteModelError" in Next.js
const Scholarship: Model<IScholarship> =
  mongoose.models.Scholarship || mongoose.model<IScholarship>("Scholarship", ScholarshipSchema);

export default Scholarship;