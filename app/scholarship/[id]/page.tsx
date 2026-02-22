import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, IndianRupee, CheckCircle, ExternalLink, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import AISection from "@/components/AISection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getIneligibilityReasons } from "@/actions/scholarshipFilters";

export default async function ScholarshipDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const clerkUser = userId ? await currentUser() : null;
  
  await connectToDatabase();
  const scholarship = await Scholarship.findById(id).lean();
  
  let userProfile = null;
  let isEligible = undefined;
  let ineligibilityReasons: string[] = [];
  
  if (clerkUser) {
    userProfile = await User.findOne({ clerkId: clerkUser.id }).lean();
    if (userProfile) {
      ineligibilityReasons = await getIneligibilityReasons(scholarship, userProfile);
      isEligible = ineligibilityReasons.length === 0;
    }
  }

  if (!scholarship) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center p-10">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scholarship Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 mt-2">The ID {id} does not exist in the database.</p>
          <Link href="/home" className="text-blue-600 dark:text-blue-400 hover:underline">← Return Home</Link>
        </div>
      </div>
    );
  }

  const s = scholarship as any;
  const hasDeadline = s.deadline instanceof Date && !isNaN(s.deadline.getTime());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scholarships
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{s.provider}</p>
            <div className="flex justify-between items-start gap-4">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{s.title}</h1>
              <Badge className="shrink-0 mt-1">{s.tags?.[0] || "Scholarship"}</Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden mb-8">
            <div className="bg-white dark:bg-slate-900 flex flex-col items-center p-5 gap-2">
              <IndianRupee className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {s.amount ? `₹${s.amount.toLocaleString("en-IN")}` : "N/A"}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Award</span>
            </div>
            <div className="bg-white dark:bg-slate-900 flex flex-col items-center p-5 gap-2">
              <MapPin className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">{s.location || "India"}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Location</span>
            </div>
            <div className="bg-white dark:bg-slate-900 flex flex-col items-center p-5 gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {hasDeadline ? new Date(s.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Open"}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Deadline</span>
            </div>
          </div>

          {/* Description */}
          {s.description && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About the Scholarship</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
            </section>
          )}

          {/* Eligibility Criteria */}
          {(s.minCGPA || s.maxIncome || s.courseRestriction || s.categoryRestriction || s.yearRestriction) && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Eligibility Criteria</h2>
              <ul className="space-y-2">
                {s.minCGPA > 0 && (
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-slate-700 dark:text-slate-300 text-sm">Minimum CGPA: <strong>{s.minCGPA}</strong></span></li>
                )}
                {s.maxIncome > 0 && (
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-slate-700 dark:text-slate-300 text-sm">Maximum Family Income: <strong>₹{s.maxIncome.toLocaleString("en-IN")}</strong></span></li>
                )}
                {s.courseRestriction && (
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-slate-700 dark:text-slate-300 text-sm">Course: <strong>{s.courseRestriction}</strong></span></li>
                )}
                {s.categoryRestriction && (
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-slate-700 dark:text-slate-300 text-sm">Category: <strong>{s.categoryRestriction}</strong></span></li>
                )}
                {s.yearRestriction && (
                  <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-slate-700 dark:text-slate-300 text-sm">Year: <strong>{s.yearRestriction}</strong></span></li>
                )}
              </ul>
            </section>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {isEligible === false ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-bold gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Scope of Improvement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-5 h-5" />
                      Scope of Improvement
                    </DialogTitle>
                    <DialogDescription>
                      Here&apos;s what you need to work on to become eligible for this scholarship:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {ineligibilityReasons.length > 0 ? (
                      ineligibilityReasons.map((reason, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-amber-800">{reason}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No specific improvement areas identified.</p>
                    )}
                    <div className="pt-2 border-t">
                      <Link href="/onboarding">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Update Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : isEligible === undefined ? (
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold" disabled>
                Sign in to Check Eligibility
              </Button>
            ) : null}
            
            {s.applyLink && (
              <a href={s.applyLink} target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className={`w-full rounded-xl font-bold gap-2 ${
                    isEligible === true 
                      ? "bg-slate-700 text-white border-slate-700 hover:bg-slate-800" 
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Apply on Official Site <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>

          {/* AI Application Designer */}
          {isEligible === true && <AISection scholarshipId={s._id.toString()} />}
        </div>
      </div>
    </div>
  );
}
