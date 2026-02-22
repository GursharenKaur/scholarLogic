"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Application from "@/models/Application";

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

  // 5. Only the Resume document is persisted; all other doc types are session-only.
  //    Merge new resume (if uploaded) with the existing saved resume.
  const PERSISTED_DOC_TYPES = ["Resume"];

  const existingUser = await User.findOne({ clerkId: userId }).lean() as any;
  const existingDocs: typeof documents = existingUser?.documents ?? [];

  // Start from existing persisted docs (resumes only)
  let mergedDocuments = existingDocs.filter((d: any) => PERSISTED_DOC_TYPES.includes(d.type));

  // Replace / add newly uploaded resume (if present)
  for (const newDoc of documents.filter(d => PERSISTED_DOC_TYPES.includes(d.type))) {
    const idx = mergedDocuments.findIndex((d: any) => d.type === newDoc.type);
    if (idx !== -1) {
      mergedDocuments[idx] = newDoc;
    } else {
      mergedDocuments.push(newDoc);
    }
  }

  // 6. Update or Create the User in MongoDB
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
      documents: mergedDocuments,
    },
    { upsert: true, new: true }
  );

  // Return successfully — client handles navigation via router.push('/home')
  return { success: true };
}

export async function getUserProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectToDatabase();
  const user = await User.findOne({ clerkId: userId }).lean();

  // Convert MongoDB document to plain JSON so Client Components can read it
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export async function deleteUserProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectToDatabase();

  // 1. Delete the user's profile
  await User.findOneAndDelete({ clerkId: userId });

  // 2. Clear all their saved/applied scholarships so they start completely fresh
  await Application.deleteMany({ clerkId: userId });

  return { success: true };
}