import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, // Links to Clerk Login
  email: { type: String, required: true },
  name: { type: String },
  cgpa: { type: Number, default: 0 },
  income: { type: Number, default: 0 }, // Annual family income
  course: { type: String }, // e.g., "B.Tech CSE"
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);