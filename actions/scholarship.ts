"use server";

import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createScholarship(formData: FormData) {
  await connectToDatabase();

  const title = formData.get("title");
  const amount = formData.get("amount");
  const provider = formData.get("provider");
  const deadline = formData.get("deadline");
  const description = formData.get("description");
  const location = formData.get("location");
  const applyLink = formData.get("applyLink");
  
  // 👇 NEW: Extract Eligibility Data
  // If the user leaves it empty, we save it as 0 (open to all)
  const minCGPA = formData.get("minCGPA") ? parseFloat(formData.get("minCGPA") as string) : 0;
  const minIncome = formData.get("minIncome") ? parseFloat(formData.get("minIncome") as string) : 0;

  await Scholarship.create({
    title,
    provider,
    amount: Number(amount),
    deadline: new Date(deadline as string),
    description,
    location,
    applyLink,
    minCGPA,    // Save to DB
    minIncome,  // Save to DB
    type: "Merit", // Defaulting for now
    educationLevel: "Undergraduate", // Defaulting for now
  });

  revalidatePath("/");
  redirect("/");
}