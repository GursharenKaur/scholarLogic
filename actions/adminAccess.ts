"use server";

import { connectToDatabase } from "@/lib/db";
import AdminWhitelist from "@/models/AdminWhitelist";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// 👑 1. The Super Admin Check (Only YOU)
export async function isSuperAdmin(email: string | undefined | null) {
    if (!email) return false;
    
    // Hardcoded skeleton key just in case
    if (email === "gautam12personal@gmail.com") return true;

    // Check against .env
    const superAdmins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
    return superAdmins.includes(email);
}

// 🛡️ 2. General Admin Check (You OR a Partner)
export async function isUserAdmin(email: string | undefined | null) {
    if (!email) return false;
    
    // Super Admins always have access
    if (await isSuperAdmin(email)) return true;

    // Check if they are a whitelisted Partner (MongoDB)
    await connectToDatabase();
    const found = await AdminWhitelist.findOne({ email }).lean();
    return !!found;
}

// ➕ 3. Grant Access (SECURED: Only Super Admins can do this)
export async function grantAdminAccess(formData: FormData) {
    const user = await currentUser();
    const myEmail = user?.emailAddresses[0]?.emailAddress;
    
    // Security block
    if (!(await isSuperAdmin(myEmail))) {
        throw new Error("Unauthorized: Only Super Admins can invite new partners.");
    }

    const targetEmail = formData.get("email") as string;
    if (!targetEmail) return;
    
    await connectToDatabase();
    await AdminWhitelist.findOneAndUpdate(
        { email: targetEmail }, 
        { email: targetEmail, addedBy: myEmail }, 
        { upsert: true }
    );
    revalidatePath("/admin");
}

// ➖ 4. Revoke Access (SECURED: Only Super Admins can do this)
export async function revokeAdminAccess(formData: FormData) {
    const user = await currentUser();
    const myEmail = user?.emailAddresses[0]?.emailAddress;
    
    // Security block
    if (!(await isSuperAdmin(myEmail))) {
        throw new Error("Unauthorized: Only Super Admins can revoke access.");
    }

    const targetEmail = formData.get("email") as string;
    if (!targetEmail) return;
    
    await connectToDatabase();
    await AdminWhitelist.findOneAndDelete({ email: targetEmail });
    revalidatePath("/admin");
}

// 📋 5. Fetch all Partners for the UI
export async function getAdminWhitelist() {
    await connectToDatabase();
    const docs = await AdminWhitelist.find().lean();
    return docs.map(d => (d as any).email);
}