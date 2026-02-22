"use server";

import { currentUser } from "@clerk/nextjs/server";
import { writeFile } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { revalidatePath } from "next/cache";

import { isUserAdmin } from "@/actions/adminAccess";

const execAsync = promisify(exec);

export async function uploadAndProcessPdf(formData: FormData) {
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    
    // 🔒 NEW: Check against the Database Whitelist & .env
    const hasAccess = await isUserAdmin(userEmail);
    if (!hasAccess) {
        throw new Error("Unauthorized Access");
    }

    const file = formData.get("pdf") as File;
    if (!file) throw new Error("No file uploaded");

    // 1. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Save it to M3's pdfs folder
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // Clean filename
    const filePath = path.join(process.cwd(), "ai_pipeline", "pdfs", fileName);
    await writeFile(filePath, buffer);

// 3. Fire the Python AI Pipeline!
    try {
        const { stdout, stderr } = await execAsync(`python3 ai_pipeline/extract_and_insert.py --file "${filePath}"`);
        
        console.log("Python Raw Output:", stdout); // Helpful for debugging

        // 👇 FIX: Find the JSON block even if there is extra text around it
        const jsonMatch = stdout.match(/\{.*\}/s);
        if (!jsonMatch) {
            throw new Error("Could not find JSON result in Python output");
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        revalidatePath("/home"); 
        
        return { 
            success: true, 
            inserted: result.insertedCount ?? 0, 
            skipped: result.skippedCount ?? 0 
        };
    } catch (error: any) {
        console.error("Pipeline crash details:", error);
        return { success: false, error: "The AI found the data but failed to format the result." };
    }
}