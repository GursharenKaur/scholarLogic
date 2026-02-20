"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import { revalidatePath } from "next/cache";

/**
 * Toggles the "Saved" status of a scholarship for the logged-in user.
 * Returns { success: true } on success or { success: false, error } on failure.
 * Never throws — safe to call from client components.
 */
export async function toggleSaveScholarship(
  scholarshipId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "You must be signed in to save scholarships." };
    }

    await connectToDatabase();

    const existingApplication = await Application.findOne({
      clerkId: userId,
      scholarshipId: scholarshipId,
    });

    if (existingApplication) {
      if (existingApplication.status === "Saved") {
        // Unsave — delete the record
        await Application.findByIdAndDelete(existingApplication._id);
      } else {
        // Applied / Won — don't remove, just inform
        return {
          success: false,
          error: "Cannot unsave a scholarship you have already applied to.",
        };
      }
    } else {
      // Save — create new record
      await Application.create({
        clerkId: userId,
        scholarshipId: scholarshipId,
        status: "Saved",
      });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("toggleSaveScholarship error:", error);
    // Duplicate key = already saved (race condition) — treat as success
    if (error?.code === 11000) {
      return { success: true };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}