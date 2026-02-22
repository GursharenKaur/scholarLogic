import mongoose from "mongoose";

const adminWhitelistSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});

export default mongoose.models.AdminWhitelist || mongoose.model("AdminWhitelist", adminWhitelistSchema);