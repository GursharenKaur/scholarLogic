import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import User from "@/models/User";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { isUserAdmin } from "@/actions/adminAccess";
import { getEligibleScholarships } from "@/actions/scholarshipFilters";
import { ThemeToggle } from "@/components/ThemeToggle";

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

    const scholarships = await getEligibleScholarships(userProfile);

    const formattedScholarships = scholarships.map((s: any) => ({
        ...s,
        _id: s._id.toString(),
        deadline: s.deadline ? new Date(s.deadline) : undefined,
        isEligible: userProfile ? true : undefined,
    }));

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/home" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md">
                            S
                        </div>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            scholar<span className="text-blue-600">Logic</span>
                        </span>
                    </Link>

                    <div className="flex gap-3 items-center">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
                            >
                                🛡️ Admin
                            </Link>
                        )}
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                            My Dashboard
                        </Link>
                        <ThemeToggle />
                        <SignedOut>
                            <SignInButton mode="modal" fallbackRedirectUrl="/home">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
                                    Sign In
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* ── Status Banner ── */}
                <div className="mb-8">
                    {userProfile ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex justify-between items-center gap-4">
                            <div>
                                <p className="font-bold text-emerald-900 dark:text-emerald-200">Welcome back, {userProfile.name}! 👋</p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                    You have <strong>{formattedScholarships.length}</strong> AI-matched scholarships waiting for you.
                                </p>
                            </div>
                            <Link href="/onboarding" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shrink-0">
                                ✏️ Edit Profile
                            </Link>
                        </div>
                    ) : clerkUser ? (
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex justify-between items-center gap-4">
                            <div>
                                <p className="font-bold text-amber-900 dark:text-amber-200">Welcome! Let&apos;s get you set up. 🚀</p>
                                <p className="text-sm text-amber-700 dark:text-amber-400">Complete your profile for instant AI matching.</p>
                            </div>
                            <Link href="/onboarding" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition shrink-0">
                                ✨ Complete Profile
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex justify-between items-center gap-4">
                            <div>
                                <p className="font-bold text-blue-900 dark:text-blue-200">🔍 Discover Your Matches</p>
                                <p className="text-sm text-blue-700 dark:text-blue-400">Sign in to see personalised eligibility badges!</p>
                            </div>
                            <SignInButton mode="modal">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shrink-0">
                                    Sign In to Match
                                </button>
                            </SignInButton>
                        </div>
                    )}
                </div>

                {/* ── Section heading ── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {userProfile ? "Your Matched Scholarships" : "Available Scholarships"}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {formattedScholarships.length} scholarship{formattedScholarships.length !== 1 ? "s" : ""} found
                    </p>
                </div>

                {/* ── Scholarship Grid ── */}
                {formattedScholarships.length === 0 ? (
                    <div className="text-center py-24 text-slate-400 dark:text-slate-600">
                        <p className="text-5xl mb-4">📭</p>
                        <p className="text-lg font-medium">No scholarships found yet.</p>
                        <p className="text-sm mt-1">Ask an admin to upload scholarship PDFs.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formattedScholarships.map((s: any) => (
                            <ScholarshipCard
                                key={s._id}
                                {...s}
                                id={s._id}
                                isSavedInitial={savedScholarshipIds.has(s._id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}