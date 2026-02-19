import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from "next/link";

// 1. Define Types (So TypeScript stops yelling)
interface UserProfile {
  name: string;
  cgpa: number;
}

interface ScholarshipData {
  _id: string; // MongoDB always returns _id
  title: string;
  provider: string;
  amount?: number;
  amountType?: "CASH" | "WAIVER";
  deadline?: Date;
  description?: string;
  minCGPA?: number;
  maxIncome?: number;
  courseRestriction?: string;
  categoryRestriction?: string;
  yearRestriction?: string;
  applyLink?: string;
  location?: string;
  educationLevel?: string;
}

export default async function Home() {
  // 2. Connect to DB
  await connectToDatabase();

  // 3. Get the current logged-in user from Clerk
  const clerkUser = await currentUser();

  // 4. Fetch ALL Scholarships
  // .lean() returns plain JS objects, but we cast it to 'unknown' first, then our Type
  const allScholarships = await Scholarship.find({}).sort({ createdAt: -1 }).lean() as unknown as ScholarshipData[];
  
  // 5. Default: Show everything
  let validScholarships: ScholarshipData[] = allScholarships;
  let userProfile: UserProfile | null = null;

  // 6. The "Matching Logic"
  if (clerkUser) {
    const user = await User.findOne({ clerkId: clerkUser.id }).lean();
    
    if (user) {
      // Cast the DB result to our UserProfile type
      userProfile = user as unknown as UserProfile;

      // FILTER: Only show eligible scholarships
      validScholarships = allScholarships.filter((scholarship) => {
        const requiredCGPA = scholarship.minCGPA || 0; 
        return userProfile!.cgpa >= requiredCGPA;
      });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Navbar Area */}
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-blue-900">
          scholar<span className="text-blue-600">Logic</span>
        </h1>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-sm font-medium hover:underline">
            My Dashboard
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Welcome Message */}
      <div className="mb-8">
        {userProfile ? (
          <div className="bg-green-100 border border-green-300 p-4 rounded-xl text-green-800">
            <p className="font-bold">Welcome back, {userProfile.name || "Student"}! 👋</p>
            <p className="text-sm">
              Based on your profile (CGPA: <strong>{userProfile.cgpa}</strong>), 
              we found <strong>{validScholarships.length}</strong> eligible scholarships for you.
            </p>
          </div>
        ) : (
          <div className="text-gray-600">
            <p>Find the financial aid you deserve. Sign in to get personalized matches.</p>
          </div>
        )}
      </div>

      {/* The Grid */}
      {validScholarships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {validScholarships.map((scholarship) => (
            <ScholarshipCard 
              key={scholarship._id.toString()} 
              // 👇 CHANGE THIS LINE
              // Instead of passing the whole object, we "spread" it (...)
              {...scholarship} 
              
              // We keep this just in case your card expects 'id' specifically
              id={scholarship._id.toString()} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No scholarships match your profile yet. 😔</p>
          <p className="text-sm text-gray-400 mt-2">Try updating your profile or check back later!</p>
        </div>
      )}
    </main>
  );
}