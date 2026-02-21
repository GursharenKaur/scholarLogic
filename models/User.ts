import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, // Links to Clerk Login
  email: { type: String, required: true },
  name: { type: String },
  cgpa: { type: Number, default: 0 },
  income: { type: Number, default: 0 }, // Annual family income
  course: { type: String }, // e.g., "B.Tech CSE"

  // New fields for comprehensive profile
  educationLevel: { type: String, enum: ["High School", "Undergraduate", "Postgraduate", "PhD"], default: "Undergraduate" },
  university: { type: String }, // Current institution
  graduationYear: { type: Number }, // Expected graduation year
  state: { type: String }, // State of residence
  country: { type: String, default: "India" }, // Country of residence
  nationality: { type: String, default: "Indian" }, // Nationality
  category: { type: String, enum: ["General", "OBC", "SC", "ST", "EWS", "Other"] },
  disability: { type: Boolean, default: false },
  firstGeneration: { type: Boolean, default: false }, // First generation learner
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
  dateOfBirth: { type: Date }, // For age calculation

  // Document storage (Cloudinary)
  documents: [{
    type: { type: String, enum: ["Income Certificate", "Resume", "Mark Sheet", "ID Proof", "Category Certificate", "Disability Certificate", "Other"] },
    fileName: { type: String },
    fileUrl: { type: String }, // Cloudinary secure_url
    publicId: { type: String }, // Cloudinary public_id (for deletion/replacement)
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);