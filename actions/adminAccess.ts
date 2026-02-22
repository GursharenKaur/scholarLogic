"use server";

import { connectToDatabase } from "@/lib/db";
import AdminWhitelist from "@/models/AdminWhitelist";
import { revalidatePath } from "next/cache";

// 1. Master Check Function
export async function isUserAdmin(email: string | undefined | null) {
    if (!email) return false;
    
    // 🔑 THE SKELETON KEY: You are ALWAYS an admin, no matter what.
    if (email === "gautam12personal@gmail.com") return true;

    // Check if they are a Super Admin (.env)
    const superAdmins = (process.env.ADMIN_EMAILS || "").split(",");
    if (superAdmins.includes(email)) return true;

    // Check if they are a Partner Admin (MongoDB)
    await connectToDatabase();
    const found = await AdminWhitelist.findOne({ email }).lean();
    return !!found;
}

// 2. Grant Access
export async function grantAdminAccess(formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) return;
    
    await connectToDatabase();
    await AdminWhitelist.findOneAndUpdate({ email }, { email }, { upsert: true });
    revalidatePath("/admin");
}

// 3. Revoke Access
export async function revokeAdminAccess(formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) return;
    
    await connectToDatabase();
    await AdminWhitelist.findOneAndDelete({ email });
    revalidatePath("/admin");
}

// 4. Fetch all Partners for the UI
export async function getAdminWhitelist() {
    await connectToDatabase();
    const docs = await AdminWhitelist.find().lean();
    return docs.map(d => (d as any).email);
}