"use server";

import connectDB from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import { revalidatePath } from "next/cache";

export async function createScholarship(formData: FormData) {
  await connectDB();

  // Extract values from the form
  const rawData = {
    title: formData.get("title") as string,
    provider: formData.get("provider") as string,
    amount: Number(formData.get("amount")),
    location: formData.get("location") as string,
    deadline: new Date(formData.get("deadline") as string),
    applyLink: formData.get("applyLink") as string,
    description: formData.get("description") as string,
  };

  try {
    const newScholarship = await Scholarship.create(rawData);
    console.log("Success! Saved to DB:", newScholarship._id);
    
    // This tells Next.js to refresh the homepage to show the new card
    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false };
  }
}