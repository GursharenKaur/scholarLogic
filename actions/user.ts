"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

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
  const clerkName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const name = (formData.get("name") as string)?.trim() || clerkName;
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
  const dateOfBirth = formData.get("dateOfBirth")
    ? new Date(formData.get("dateOfBirth") as string)
    : undefined;

  // 4. Collect uploaded document metadata (URLs saved by /api/upload-document)
  const docTypeLabels: Record<string, string> = {
    income: "Income Certificate",
    resume: "Resume",
    marksheet: "Mark Sheet",
    idproof: "ID Proof",
    category: "Category Certificate",
    disability: "Disability Certificate",
  };

  const documents: { type: string; fileName: string; fileUrl: string; publicId: string; uploadedAt: Date }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("docUrl_") && typeof value === "string" && value.length > 0) {
      const docKey = key.replace("docUrl_", "");
      const docLabel = docTypeLabels[docKey] ?? "Other";
      const fileName = (formData.get(`docName_${docKey}`) as string) ?? "";
      const publicId = (formData.get(`docPublicId_${docKey}`) as string) ?? "";
      documents.push({ type: docLabel, fileName, fileUrl: value, publicId, uploadedAt: new Date() });
    }
  }

  // 5. Update or Create the User in MongoDB
  await User.findOneAndUpdate(
    { clerkId: userId },
    {
      clerkId: userId,
      email: user.emailAddresses[0].emailAddress,
      name,
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
      // Only overwrite documents if new ones were uploaded
      ...(documents.length > 0 && { documents }),
    },
    { upsert: true, new: true }
  );

  // Return successfully — client handles navigation via router.push('/')
  return { success: true };
}