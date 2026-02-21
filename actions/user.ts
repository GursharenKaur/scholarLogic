"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { redirect } from "next/navigation";

export async function saveUserProfile(formData: FormData) {
  // 1. Check if user is logged in
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    throw new Error("You must be signed in");
  }

  // 2. Connect to DB
  await connectToDatabase();

  // 3. Extract Data from Form
  const cgpa = parseFloat(formData.get("cgpa") as string);
  const income = parseFloat(formData.get("income") as string);
  const course = formData.get("course") as string;
  const educationLevel = formData.get("educationLevel") as string;
  const university = formData.get("university") as string;
  const graduationYear = parseInt(formData.get("graduationYear") as string);
  const state = formData.get("state") as string;
  const country = formData.get("country") as string;
  const nationality = formData.get("nationality") as string;
  const category = formData.get("category") as string;
  const disability = formData.get("disability") === "on";
  const firstGeneration = formData.get("firstGeneration") === "on";
  const gender = formData.get("gender") as string;
  const dateOfBirth = formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : undefined;

  // 4. Update or Create the User in MongoDB
  await User.findOneAndUpdate(
    { clerkId: userId },
    {
      clerkId: userId,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      cgpa,
      income,
      course,
      educationLevel,
      university,
      graduationYear,
      state,
      country,
      nationality,
      category,
      disability,
      firstGeneration,
      gender,
      dateOfBirth,
    },
    { upsert: true, new: true } // Create if doesn't exist
  );

  // 5. Go back to homepage
  redirect("/");
}

export async function getUserProfile() {
  const { userId } = await auth();
  if (!userId) return null;
  
  await connectToDatabase();
  const user = await User.findOne({ clerkId: userId }).lean();
  
  // Convert MongoDB document to plain JSON so Client Components can read it
  return user ? JSON.parse(JSON.stringify(user)) : null;
}