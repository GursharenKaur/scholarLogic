import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bookmark,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  FileImage,
  ExternalLink,
  Download,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

// ─── helpers ────────────────────────────────────────────────────────────────

function daysUntil(date: Date | string): number {
  const now = new Date();
  const deadline = new Date(date);
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns 0‒100 completion score + list of missing fields */
function getProfileCompletion(profile: any): { score: number; missing: string[] } {
  const fields: { label: string; check: (p: any) => boolean }[] = [
    { label: "Full name", check: (p) => !!p?.name },
    { label: "CGPA", check: (p) => !!p?.cgpa && p.cgpa > 0 },
    { label: "Annual income", check: (p) => !!p?.income && p.income > 0 },
    { label: "Course", check: (p) => !!p?.course },
    { label: "University", check: (p) => !!p?.university },
    { label: "Graduation year", check: (p) => !!p?.graduationYear },
    { label: "State", check: (p) => !!p?.state },
    { label: "Category", check: (p) => !!p?.category },
    { label: "Gender", check: (p) => !!p?.gender },
    { label: "Date of birth", check: (p) => !!p?.dateOfBirth },
  ];

  const missing = fields.filter((f) => !f.check(profile)).map((f) => f.label);
  const score = Math.round(((fields.length - missing.length) / fields.length) * 100);
  return { score, missing };
}

/** Count scholarships that roughly match the user's profile */
function countMatching(scholarships: any[], profile: any): number {
  if (!profile) return 0;
  return scholarships.filter((s) => {
    const cgpaOk = !s.minCGPA || (profile.cgpa ?? 0) >= s.minCGPA;
    const incomeOk = !s.maxIncome || (profile.income ?? 0) <= s.maxIncome;
    return cgpaOk && incomeOk;
  }).length;
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  await connectToDatabase();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [applications, userProfile, allScholarships] = await Promise.all([
    Application.find({ clerkId: userId }).populate("scholarshipId").lean(),
    User.findOne({ clerkId: userId }).lean(),
    Scholarship.find({}).lean(),
  ]);

  const saved = (applications as any[]).filter((app) => app.status === "Saved");

  // Scholarships expiring within 7 days (from saved list)
  const urgentSaved = saved.filter((app) => {
    const days = daysUntil(app.scholarshipId?.deadline);
    return days >= 0 && days <= 7;
  });

  // Profile completion
  const { score: profileScore, missing: profileMissing } = getProfileCompletion(userProfile);

  // Stats
  const totalScholarships = allScholarships.length;
  const matchingCount = countMatching(allScholarships, userProfile);
  const newThisWeek = allScholarships.filter(
    (s: any) => s.createdAt && new Date(s.createdAt) >= sevenDaysAgo
  ).length;

  // Serialise deadline for client
  const urgentCards = urgentSaved.map((app: any) => ({
    id: app.scholarshipId._id.toString(),
    title: app.scholarshipId.title,
    provider: app.scholarshipId.provider,
    amount: app.scholarshipId.amount,
    location: app.scholarshipId.location,
    deadline: app.scholarshipId.deadline,
    tags: app.scholarshipId.tags,
    daysLeft: daysUntil(app.scholarshipId.deadline),
  }));

  // Extract persisted resume (the only doc shown on dashboard)
  const resumeDoc = (userProfile as any)?.documents?.find((d: any) => d.type === "Resume") ?? null;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.firstName}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening with your scholarship journey.
        </p>
      </div>

      {/* ── ⚠️ Deadline Alert Strip ────────────────────────────────────── */}
      {urgentCards.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            {urgentCards.length} saved scholarship{urgentCards.length > 1 ? "s are" : " is"} expiring within 7 days!
          </div>
          <div className="flex flex-col gap-2">
            {urgentCards.map((s) => (
              <Link
                key={s.id}
                href={`/scholarship/${s.id}`}
                className="flex items-center justify-between rounded-lg bg-white border border-amber-100 px-4 py-3 hover:border-amber-300 transition-colors group"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900 group-hover:text-amber-700 transition-colors">
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.provider}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${s.daysLeft === 0
                    ? "bg-red-100 text-red-700"
                    : s.daysLeft <= 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-amber-100 text-amber-700"
                    }`}
                >
                  {s.daysLeft === 0 ? "Today!" : `${s.daysLeft}d left`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats + Profile Completion row ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Saved count */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saved</CardTitle>
            <Bookmark className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saved.length}</div>
            <p className="text-xs text-muted-foreground">scholarships bookmarked</p>
          </CardContent>
        </Card>

        {/* Total scholarships */}
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
            <Users className="w-4 h-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScholarships}</div>
            <p className="text-xs text-muted-foreground">scholarships on platform</p>
          </CardContent>
        </Card>

        {/* Matching profile */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Matching You</CardTitle>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchingCount}</div>
            <p className="text-xs text-muted-foreground">fit your profile</p>
          </CardContent>
        </Card>

        {/* New this week */}
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisWeek}</div>
            <p className="text-xs text-muted-foreground">added in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Profile Completion Bar ──────────────────────────────────────── */}
      <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-base">Profile Completion</h2>
          </div>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full ${profileScore === 100
              ? "bg-green-100 text-green-700"
              : profileScore >= 60
                ? "bg-indigo-100 text-indigo-700"
                : "bg-amber-100 text-amber-700"
              }`}
          >
            {profileScore}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${profileScore === 100
              ? "bg-green-500"
              : profileScore >= 60
                ? "bg-indigo-500"
                : "bg-amber-500"
              }`}
            style={{ width: `${profileScore}%` }}
          />
        </div>

        {profileScore === 100 ? (
          <p className="text-sm text-green-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Your profile is complete — you'll get the best scholarship matches!
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              A complete profile unlocks better scholarship matches. Fill in:
            </p>
            <div className="flex flex-wrap gap-2">
              {profileMissing.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border"
                >
                  <Circle className="w-2.5 h-2.5 text-gray-400" />
                  {field}
                </span>
              ))}
            </div>
            <Link
              href="/onboarding"
              className="inline-block mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
            >
              Complete your profile →
            </Link>
          </div>
        )}
      </div>

      {/* ── My Resume ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-indigo-500" />
          My Resume
        </h2>

        {resumeDoc ? (() => {
          const doc = resumeDoc as any;
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileName ?? "") ||
            doc.fileUrl?.includes("/image/");
          const isPdf = /\.pdf$/i.test(doc.fileName ?? "") ||
            doc.fileUrl?.includes("/raw/") ||
            doc.fileUrl?.endsWith(".pdf");
          const uploadDate = doc.uploadedAt
            ? new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })
            : "";
          return (
            <div className="max-w-sm">
              <div className="group relative rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Thumbnail / Preview area */}
                <div className="h-36 bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.fileUrl}
                      alt={doc.type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-indigo-400">
                      {isPdf ? (
                        <FileText className="w-12 h-12" />
                      ) : (
                        <FileImage className="w-12 h-12" />
                      )}
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {isPdf ? "PDF" : "Document"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info row */}
                <div className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{doc.type}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={doc.fileName}>
                        {doc.fileName || "Uploaded file"}
                      </p>
                      {uploadDate && (
                        <p className="text-xs text-gray-400 mt-1">Uploaded {uploadDate}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${isPdf ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      }`}>
                      {isPdf ? "PDF" : "IMG"}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName || doc.type}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="text-center py-14 border-2 border-dashed rounded-xl">
            <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">No resume uploaded yet.</p>
            <Link
              href="/onboarding"
              className="inline-block mt-2 text-sm text-indigo-600 hover:underline font-semibold"
            >
              Upload your resume →
            </Link>
          </div>
        )}
      </div>

      {/* ── Saved Scholarships ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-blue-500" />
          Saved Scholarships
        </h2>
        {saved.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {saved.map((app: any) => (
              <ScholarshipCard
                key={app._id}
                id={app.scholarshipId._id.toString()}
                title={app.scholarshipId.title}
                provider={app.scholarshipId.provider}
                amount={app.scholarshipId.amount}
                location={app.scholarshipId.location}
                deadline={app.scholarshipId.deadline}
                tags={app.scholarshipId.tags}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Bookmark className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">No saved scholarships yet.</p>
            <Link
              href="/home"
              className="inline-block mt-2 text-sm text-blue-600 hover:underline font-semibold"
            >
              Browse scholarships →
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}