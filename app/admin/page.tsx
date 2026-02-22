import { createScholarship } from "@/actions/scholarship";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminPdfUpload } from "@/components/AdminPdfUpload";
import Link from "next/link";
import { ArrowLeft, ShieldPlus, Trash2 } from "lucide-react";
import { isUserAdmin, isSuperAdmin, grantAdminAccess, revokeAdminAccess, getAdminWhitelist } from "@/actions/adminAccess";

export default async function AdminPage() {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  // 1. General Access Check (Lets Partners and You in)
  const hasAccess = await isUserAdmin(userEmail);
  if (!hasAccess) redirect("/home");

  // 2. Boss Check (Only lets YOU see the invite form)
  const superAdmin = await isSuperAdmin(userEmail);
  const whitelistedEmails = superAdmin ? await getAdminWhitelist() : [];

  return (
    <div className="max-w-3xl mx-auto p-10 space-y-10 min-h-screen">

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Command Center</h1>
        <Link href="/home" className="flex items-center text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to App
        </Link>
      </div>

      {/* 👑 ONLY VISIBLE TO SUPER ADMIN 👑 */}
      {superAdmin && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-indigo-900">1. Partner Access Management</h2>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <form action={grantAdminAccess} className="flex gap-4 mb-6">
              <input name="email" type="email" placeholder="partner@university.edu" className="flex-1 p-3 border rounded-lg bg-slate-50" required suppressHydrationWarning />
              <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 transition-colors" suppressHydrationWarning>
                <ShieldPlus className="w-5 h-5" /> Grant Access
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Authorized Partners:</h3>
              {whitelistedEmails.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No partner emails added yet.</p>
              ) : (
                whitelistedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">{email}</span>
                    <form action={revokeAdminAccess}>
                      <input type="hidden" name="email" value={email} />
                      <button type="submit" className="text-red-500 hover:text-red-700 p-2 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* 🚀 AI PIPELINE UPLOAD (Visible to all admins) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-indigo-900">
          {superAdmin ? "2." : "1."} Automated AI Ingestion
        </h2>
        <AdminPdfUpload />
      </section>

      {/* ✍️ MANUAL FALLBACK (Visible to all admins) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {superAdmin ? "3." : "2."} Manual Data Entry
        </h2>
        <form action={createScholarship} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div>
            <label className="block font-medium mb-1">Scholarship Title</label>
            <input name="title" type="text" placeholder="e.g. Super Smart Scholarship" className="w-full p-3 border rounded-lg bg-slate-50" required suppressHydrationWarning />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-medium mb-1">Provider</label><input name="provider" type="text" className="w-full p-3 border rounded-lg bg-slate-50" required suppressHydrationWarning /></div>
            <div><label className="block font-medium mb-1">Amount (₹)</label><input name="amount" type="number" className="w-full p-3 border rounded-lg bg-slate-50" required suppressHydrationWarning /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-medium mb-1">Location</label><input name="location" type="text" className="w-full p-3 border rounded-lg bg-slate-50" suppressHydrationWarning /></div>
            <div><label className="block font-medium mb-1">Deadline</label><input name="deadline" type="date" className="w-full p-3 border rounded-lg bg-slate-50" required suppressHydrationWarning /></div>
          </div>
          <div><label className="block font-medium mb-1">Description</label><textarea name="description" rows={3} className="w-full p-3 border rounded-lg bg-slate-50" required /></div>
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md" suppressHydrationWarning>
            Push to Database
          </button>
        </form>
      </section>
    </div>
  );
}