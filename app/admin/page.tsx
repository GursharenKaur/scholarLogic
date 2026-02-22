import { createScholarship } from "@/actions/scholarship";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminPdfUpload } from "@/components/AdminPdfUpload";
import Link from "next/link";
import { ArrowLeft, ShieldPlus, Trash2 } from "lucide-react";
import { isUserAdmin, isSuperAdmin, grantAdminAccess, revokeAdminAccess, getAdminWhitelist } from "@/actions/adminAccess";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function AdminPage() {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  const hasAccess = await isUserAdmin(userEmail);
  if (!hasAccess) redirect("/home");

  const superAdmin = await isSuperAdmin(userEmail);
  const whitelistedEmails = superAdmin ? await getAdminWhitelist() : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white">🛡️ Admin Command Center</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Command Center</h1>

        {/* Partner Access Management — SUPER ADMIN ONLY */}
        {superAdmin && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">1. Partner Access Management</h2>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <form action={grantAdminAccess} className="flex gap-3 mb-6">
                <input
                  name="email"
                  type="email"
                  placeholder="partner@university.edu"
                  className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
                  suppressHydrationWarning
                >
                  <ShieldPlus className="w-5 h-5" /> Grant Access
                </button>
              </form>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Authorized Partners:</h3>
                {whitelistedEmails.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No partner emails added yet.</p>
                ) : (
                  whitelistedEmails.map(email => (
                    <div key={email} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{email}</span>
                      <form action={revokeAdminAccess}>
                        <input type="hidden" name="email" value={email} />
                        <button type="submit" className="text-red-400 hover:text-red-600 p-1.5 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* AI Pipeline Upload */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
            {superAdmin ? "2." : "1."} Automated AI Ingestion
          </h2>
          <AdminPdfUpload />
        </section>

        {/* Manual Data Entry */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">
            {superAdmin ? "3." : "2."} Manual Data Entry
          </h2>
          <form action={createScholarship} className="space-y-5 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Scholarship Title</label>
              <input name="title" type="text" placeholder="e.g. Merit-cum-Means Scholarship" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" required suppressHydrationWarning />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Provider</label>
                <input name="provider" type="text" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" required suppressHydrationWarning />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Amount (₹)</label>
                <input name="amount" type="number" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" required suppressHydrationWarning />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Location</label>
                <input name="location" type="text" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" suppressHydrationWarning />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Deadline</label>
                <input name="deadline" type="date" className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" required suppressHydrationWarning />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Apply Link (URL)</label>
              <input name="applyLink" type="url" placeholder="https://..." className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" suppressHydrationWarning />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
              <textarea name="description" rows={3} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" required />
            </div>
            <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md" suppressHydrationWarning>
              Push to Database
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}