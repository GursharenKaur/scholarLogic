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
    },
    { upsert: true, new: true } // Create if doesn't exist
  );

  // 5. Go back to homepage
  redirect("/");
}