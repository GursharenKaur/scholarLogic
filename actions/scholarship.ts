"use server";

import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createScholarship(formData: FormData) {
  try {
    await connectToDatabase();

    const title = formData.get("title") as string;
    const amount = formData.get("amount") as string;
    const provider = formData.get("provider") as string;
    const deadline = formData.get("deadline") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const applyLink = formData.get("applyLink") as string;

    // If the user leaves it empty, we save it as 0 (open to all)
    const minCGPA = formData.get("minCGPA")
      ? parseFloat(formData.get("minCGPA") as string)
      : 0;
    // FIX: schema field is maxIncome, not minIncome
    const maxIncome = formData.get("maxIncome")
      ? parseFloat(formData.get("maxIncome") as string)
      : 0;

    await Scholarship.create({
      title,
      provider,
      amount: Number(amount),
      deadline: deadline ? new Date(deadline) : undefined,
      description,
      location,
      applyLink,
      minCGPA,
      maxIncome,         // FIX: was wrongly named minIncome before
      type: "Merit",
      educationLevel: "Undergraduate",
    });
  } catch (error) {
    console.error("[createScholarship] Failed to create scholarship:", error);
    throw error; // Re-throw so Next.js surfaces it — check terminal for details
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}