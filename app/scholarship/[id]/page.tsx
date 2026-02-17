import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  IndianRupee,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import AISection from "@/components/AISection";

export default async function ScholarshipDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Next.js 15 async params
  const { id } = await params;

  // ✅ Connect DB
  await connectToDatabase();

  // ✅ Fetch scholarship
  const scholarship = await Scholarship.findById(id).lean();

  if (!scholarship) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold">Scholarship Not Found</h1>
        <p className="text-slate-500 mb-4">
          The ID {id} does not exist in the database.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-sm border p-8">
        
        {/* 🔙 Back Button */}
        <Link
          href="/"
          className="flex items-center text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scholarships
        </Link>

        {/* 🏷 Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-600 font-semibold mb-1">
                {(scholarship as any).provider}
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                {(scholarship as any).title}
              </h1>
            </div>

            <Badge className="text-md px-3 py-1">
              {(scholarship as any).tags?.[0] || "New Opportunity"}
            </Badge>
          </div>
        </div>

        {/* 💰 Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-lg border">
          <div className="flex flex-col items-center p-2">
            <IndianRupee className="w-6 h-6 text-green-600 mb-2" />
            <span className="font-bold text-lg">
              ₹{(scholarship as any).amount?.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Award Amount
            </span>
          </div>

          <div className="flex flex-col items-center p-2 border-l border-slate-200">
            <MapPin className="w-6 h-6 text-blue-500 mb-2" />
            <span className="font-bold text-lg">
              {(scholarship as any).location || "India"}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Location
            </span>
          </div>

          <div className="flex flex-col items-center p-2 border-l border-slate-200">
            <Calendar className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-lg">
              {new Date((scholarship as any).deadline).toLocaleDateString()}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Deadline
            </span>
          </div>
        </div>

        {/* 📄 Description */}
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">
              About the Scholarship
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {(scholarship as any).description}
            </p>
          </section>

          {(scholarship as any).eligibility && (
            <section>
              <h3 className="text-xl font-semibold mb-3">
                Eligibility Criteria
              </h3>
              <ul className="space-y-2">
                {(scholarship as any).eligibility.map(
                  (item: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}
        </div>

        {/* 🔗 Apply Button */}
        <div className="mt-10 pt-6 border-t flex justify-end">
          <a
            href={(scholarship as any).applyLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Apply on Official Site
            </Button>
          </a>
        </div>

        {/* 🤖 AI Assistant */}
        <AISection scholarshipId={(scholarship as any)._id.toString()} />

      </div>
    </div>
  );
}
