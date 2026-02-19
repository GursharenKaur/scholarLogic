import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApplication extends Document {
  clerkId: string; // The User
  scholarshipId: mongoose.Types.ObjectId; // The Scholarship
  status: "Saved" | "Applied" | "Rejected" | "Won";
  appliedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    clerkId: { type: String, required: true, index: true },
    scholarshipId: { 
      type: Schema.Types.ObjectId, 
      ref: "Scholarship", 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["Saved", "Applied", "Rejected", "Won"], 
      default: "Saved" 
    },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate applications (one user cannot save the same scholarship twice)
ApplicationSchema.index({ clerkId: 1, scholarshipId: 1 }, { unique: true });

const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>("Application", ApplicationSchema);

export default Application;