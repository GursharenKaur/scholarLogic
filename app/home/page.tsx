import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import Application from "@/models/Application";
import User from "@/models/User";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
    name: string;
    cgpa: number;
    income?: number;   // 0 = not set; we skip income check in that case
    course?: string;   // e.g. "B.Tech CSE"
    category?: string; // "General" | "OBC" | "SC" | "ST" | "EWS" | "Other"
    graduationYear?: number;
}

interface ScholarshipData {
    _id: string;
    title: string;
    provider: string;
    amount?: number;
    amountType?: "CASH" | "WAIVER";
    deadline?: Date;
    description?: string;
    minCGPA?: number;
    maxIncome?: number;
    courseRestriction?: string;   // comma-separated e.g. "BCom, BSc, BA"
    categoryRestriction?: string; // comma-separated e.g. "SC, ST"
    yearRestriction?: string;
    applyLink?: string;
    location?: string;
    educationLevel?: string;
    sourcePdf?: string;
    tags?: string[];
}

// ─── Eligibility Helper ───────────────────────────────────────────────────────

/**
 * Returns true only when every restriction the scholarship specifies is met
 * by the user's profile. A missing restriction means no constraint → passes.
 */
function checkEligibility(
    scholarship: ScholarshipData,
    profile: UserProfile | null
): boolean {
    if (!profile) return false;

    // 1. CGPA — user must meet the minimum
    if (scholarship.minCGPA && profile.cgpa < scholarship.minCGPA) return false;

    // 2. Income — only enforce when scholarship has a cap AND user has income > 0
    //    (income === 0 means "not filled in", skip to avoid false negatives)
    if (scholarship.maxIncome && profile.income && profile.income > 0) {
        if (profile.income > scholarship.maxIncome) return false;
    }

    // 3. Course restriction — e.g. "BCom, BSc, BA"
    //    User must have at least one word of their course in the allowed list
    if (scholarship.courseRestriction && profile.course) {
        const allowed = scholarship.courseRestriction.toLowerCase();
        const userCourse = profile.course.toLowerCase();
        const anyMatch = userCourse
            .split(/[\s,]+/)
            .some((word) => word.length > 1 && allowed.includes(word));
        if (!anyMatch) return false;
    }

    // 4. Category restriction — e.g. "SC, ST, OBC"
    if (scholarship.categoryRestriction && profile.category) {
        const allowed = scholarship.categoryRestriction.toLowerCase();
        if (!allowed.includes(profile.category.toLowerCase())) return false;
    }

    return true;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function Home() {
    await connectToDatabase();

    // On public routes, currentUser() can throw if Clerk auth context is
    // not populated. Safely check userId first via auth().
    const { userId } = await auth();
    const clerkUser = userId ? await currentUser() : null;

    // Fetch ALL scholarships
    const rawScholarships = await Scholarship.find({})
        .sort({ createdAt: -1 })
        .lean();

    const allScholarships: ScholarshipData[] = rawScholarships.map((s) => ({
        ...s,
        _id: s._id.toString(),
        deadline: s.deadline ? new Date(s.deadline) : undefined,
    }));

    let userProfile: UserProfile | null = null;
    let savedScholarshipIds = new Set<string>();


    if (clerkUser) {
        const [user, savedApplications] = await Promise.all([
            User.findOne({ clerkId: clerkUser.id }).lean(),
            Application.find({ clerkId: clerkUser.id, status: "Saved" }).lean(),
        ]);

        // (We removed the redirect failsafe from here!)

        savedScholarshipIds = new Set(
            savedApplications.map((app) => app.scholarshipId.toString())
        );

        if (user) {
            userProfile = user as unknown as UserProfile;
        }
    }

    // Tag each scholarship with eligibility, then sort: eligible first
    const scholarships = allScholarships
        .map((s) => ({
            ...s,
            isEligible: checkEligibility(s, userProfile),
        }))
        .sort((a, b) => Number(b.isEligible) - Number(a.isEligible));

    const eligibleCount = scholarships.filter((s) => s.isEligible).length;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            {/* Navbar */}
            <nav className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold text-blue-900">
                    scholar<span className="text-blue-600">Logic</span>
                </h1>
                <div className="flex gap-4 items-center">
                    {/* 👇 We removed the Update Profile link from here! */}
                    <Link href="/dashboard" className="text-sm font-medium hover:underline">
                        My Dashboard
                    </Link>
                    <SignedOut>
                        <SignInButton mode="modal" fallbackRedirectUrl="/home">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </nav>

            
            {/* Welcome / Status Banner */}
            <div className="mb-8">
                {userProfile ? (
                    <div key="banner-green" className="bg-green-100 border border-green-300 p-4 rounded-xl text-green-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="font-bold">
                                Welcome back, {userProfile.name || "Student"}! 👋
                            </p>
                            <p className="text-sm mt-1 text-green-800">
                                Based on your profile (CGPA: <strong>{userProfile.cgpa}</strong>
                                {userProfile.course && <>, Course: <strong>{userProfile.course}</strong></>}
                                {userProfile.category && <>, Category: <strong>{userProfile.category}</strong></>}
                                ), you are eligible for <strong>{eligibleCount}</strong> out of{" "}
                                <strong>{scholarships.length}</strong> scholarships.
                            </p>
                        </div>
                        <Link 
                            href="/onboarding" 
                            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shrink-0 shadow-sm"
                        >
                            ✏️ Edit Profile
                        </Link>
                    </div>
                ) : clerkUser ? (
                    <div key="banner-amber" className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-amber-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="font-bold text-amber-800">
                                Welcome! Let&apos;s get you set up. 🚀
                            </p>
                            <p className="text-sm mt-1 text-amber-800">
                                You are browsing <strong>{scholarships.length}</strong> scholarships. Complete your profile so our AI can instantly match you with the ones you actually qualify for!
                            </p>
                        </div>
                        <Link 
                            href="/onboarding" 
                            className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors shrink-0 shadow-sm"
                        >
                            ✨ Complete Profile
                        </Link>
                    </div>
                ) : (
                    <div key="banner-blue" className="bg-blue-50 border border-blue-300 p-4 rounded-xl text-blue-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="font-bold text-blue-800">
                                🔍 Discover Your Matches
                            </p>
                            <p className="text-sm mt-1 text-blue-800">
                                You are currently browsing all <strong>{scholarships.length}</strong> scholarships. Sign in and complete your profile to see personalised eligibility badges!
                            </p>
                        </div>
                        <SignInButton mode="modal" fallbackRedirectUrl="/home">
                            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0 shadow-sm">
                                Sign In to Match
                            </button>
                        </SignInButton>
                    </div>
                )}
            </div>


            {/* Scholarship Grid */}
            {scholarships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scholarships.map((scholarship) => (
                        <ScholarshipCard
                            key={scholarship._id}
                            id={scholarship._id}
                            title={scholarship.title}
                            provider={scholarship.provider}
                            amount={scholarship.amount}
                            amountType={scholarship.amountType}
                            location={scholarship.location}
                            deadline={scholarship.deadline}
                            tags={scholarship.tags}
                            courseRestriction={scholarship.courseRestriction}
                            categoryRestriction={scholarship.categoryRestriction}
                            yearRestriction={scholarship.yearRestriction}
                            minCGPA={scholarship.minCGPA}
                            maxIncome={scholarship.maxIncome}
                            sourcePdf={scholarship.sourcePdf}
                            isSavedInitial={savedScholarshipIds.has(scholarship._id)}
                            isEligible={userProfile !== null ? scholarship.isEligible : undefined}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">No scholarships found. 😔</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Check back later — new scholarships are added regularly!
                    </p>
                </div>
            )}
        </main>
    );
}
