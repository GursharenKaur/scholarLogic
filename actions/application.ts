"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import { revalidatePath } from "next/cache";

/**
 * Toggles the "Saved" status of a scholarship for the logged-in user.
 * If already saved, it removes it. If not, it creates a "Saved" entry.
 */
export async function toggleSaveScholarship(scholarshipId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to save scholarships.");
  }

  await connectToDatabase();

  try {
    // Check if the application record already exists
    const existingApplication = await Application.findOne({
      clerkId: userId,
      scholarshipId: scholarshipId,
    });

    if (existingApplication) {
      // If it exists and is just "Saved", we remove it (unsave)
      // If it is "Applied" or "Won", we probably shouldn't delete it
      if (existingApplication.status === "Saved") {
        await Application.findByIdAndDelete(existingApplication._id);
      } else {
        return { message: "Cannot unsave an active application." };
      }
    } else {
      // Create a new record with status "Saved"
      await Application.create({
        clerkId: userId,
        scholarshipId: scholarshipId,
        status: "Saved",
      });
    }

    // Refresh the data on the homepage and dashboard
    revalidatePath("/");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling scholarship save:", error);
    return { success: false, error: "Failed to update scholarship status." };
  }
}