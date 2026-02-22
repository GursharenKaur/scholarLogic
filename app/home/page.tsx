import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import User from "@/models/User";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { isUserAdmin } from "@/actions/adminAccess";
import { getEligibleScholarships } from "@/actions/scholarshipFilters";

export const dynamic = "force-dynamic";

interface UserProfile {
    name: string;
    cgpa: number;
    income?: number;
    course?: string;
    category?: string;
    graduationYear?: number;
}

export default async function Home() {
    await connectToDatabase();

    const { userId } = await auth();
    const clerkUser = userId ? await currentUser() : null;
    
    // Check Admin Access via DB Whitelist
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;
    const isAdmin = await isUserAdmin(userEmail);

    let userProfile: UserProfile | null = null;
    let savedScholarshipIds = new Set<string>();

    if (clerkUser) {
        const [user, savedApplications] = await Promise.all([
            User.findOne({ clerkId: clerkUser.id }).lean(),
            Application.find({ clerkId: clerkUser.id, status: "Saved" }).lean(),
        ]);

        savedScholarshipIds = new Set(
            savedApplications.map((app) => (app as any).scholarshipId.toString())
        );

        if (user) userProfile = user as unknown as UserProfile;
    }

    // 🚀 UPGRADE: Server-side Aggregation Pipeline
    const scholarships = await getEligibleScholarships(userProfile);

    const formattedScholarships = scholarships.map((s: any) => ({
        ...s,
        _id: s._id.toString(),
        deadline: s.deadline ? new Date(s.deadline) : undefined,
        isEligible: userProfile ? true : undefined,
    }));

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <nav className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold text-blue-900">
                    scholar<span className="text-blue-600">Logic</span>
                </h1>
                <div className="flex gap-4 items-center">
                    {isAdmin && (
                        <Link href="/admin" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                            🛡️ Admin Portal
                        </Link>
                    )}
                    <Link href="/dashboard" className="text-sm font-medium hover:underline">My Dashboard</Link>
                    <SignedOut>
                        <SignInButton mode="modal" fallbackRedirectUrl="/home">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Sign In</button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
                </div>
            </nav>

            {/* Status Banners */}
            <div className="mb-8">
                {userProfile ? (
                    <div key="banner-green" className="bg-green-100 border border-green-300 p-4 rounded-xl text-green-900 flex justify-between items-center gap-4">
                        <div>
                            <p className="font-bold">Welcome back, {userProfile.name}! 👋</p>
                            <p className="text-sm text-green-800">You have <strong>{formattedScholarships.length}</strong> AI-matched scholarships waiting for you.</p>
                        </div>
                        <Link href="/onboarding" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">✏️ Edit Profile</Link>
                    </div>
                ) : clerkUser ? (
                    <div key="banner-amber" className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-amber-900 flex justify-between items-center gap-4">
                        <p className="font-bold">Welcome! Let&apos;s get you set up. 🚀 <span className="text-sm font-normal block">Complete your profile for instant AI matching.</span></p>
                        <Link href="/onboarding" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">✨ Complete Profile</Link>
                    </div>
                ) : (
                    <div key="banner-blue" className="bg-blue-50 border border-blue-300 p-4 rounded-xl text-blue-900 flex justify-between items-center gap-4">
                        <p className="font-bold">🔍 Discover Your Matches <span className="text-sm font-normal block">Sign in to see personalised eligibility badges!</span></p>
                        <SignInButton mode="modal"><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">Sign In to Match</button></SignInButton>
                    </div>
                )}
            </div>

            {/* Scholarship Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formattedScholarships.map((s: any) => (
                    <ScholarshipCard key={s._id} {...s} id={s._id} isSavedInitial={savedScholarshipIds.has(s._id)} />
                ))}
            </div>
        </main>
    );
}