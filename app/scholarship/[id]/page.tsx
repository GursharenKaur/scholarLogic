import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, IndianRupee, CheckCircle } from "lucide-react";
import Link from "next/link";

// Mock Data Lookup
const getScholarship = (id: string) => {
  const allScholarships = {
    "1": {
      title: "HDFC Badhte Kadam",
      provider: "HDFC Bank",
      amount: 100000,
      location: "Pan-India",
      deadline: "2026-03-31",
      description: "A scholarship designed to help high-performing students from underprivileged backgrounds continue their education.",
      eligibility: ["Class 12 passed with 80%", "Annual family income < 6L", "Indian Citizen"],
      tags: ["Undergraduate", "Need-based"],
    },
    "2": {
      title: "Tata Capital Pankh",
      provider: "Tata Capital",
      amount: 12000,
      location: "Maharashtra",
      deadline: "2026-04-15",
      description: "Supporting students in Class 11 and 12 to ensure they do not drop out due to financial constraints.",
      eligibility: ["Class 11 or 12 student", "Family income < 4L", "50% marks in previous class"],
      tags: ["School", "Merit-based"],
    },
    "3": {
      title: "Google Generation Scholarship",
      provider: "Google",
      amount: 250000,
      location: "Online",
      deadline: "2026-05-10",
      description: "For women in computer science. Helps aspiring computer scientists excel in technology and become leaders in the field.",
      eligibility: ["Identify as female", "Enrolled in Bachelor's program", "Strong academic record"],
      tags: ["Women in Tech", "Computer Science"],
    }
  };
  // @ts-ignore
  return allScholarships[id];
};

// NOTICE: generic "params" type here to fix the version conflict
export default async function ScholarshipDetail({ params }: { params: Promise<{ id: string }> }) {
  // 1. Await the params to unlock the ID
  const { id } = await params;
  
  // 2. Fetch data using the unlocked ID
  const scholarship = getScholarship(id);

  if (!scholarship) {
    return <div className="p-10 text-center"> Scholarship {id} not found </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-sm border p-8">
        
        {/* Back Button */}
        <Link href="/" className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scholarships
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-600 font-semibold mb-1">{scholarship.provider}</p>
              <h1 className="text-3xl font-bold text-slate-900">{scholarship.title}</h1>
            </div>
            <Badge className="text-md px-3 py-1">{scholarship.tags[0]}</Badge>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-lg border">
          <div className="flex flex-col items-center p-2">
            <IndianRupee className="w-6 h-6 text-green-600 mb-2" />
            <span className="font-bold text-lg">₹{scholarship.amount.toLocaleString()}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Award Amount</span>
          </div>
          <div className="flex flex-col items-center p-2 border-l border-slate-200">
            <MapPin className="w-6 h-6 text-blue-500 mb-2" />
            <span className="font-bold text-lg">{scholarship.location}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Location</span>
          </div>
          <div className="flex flex-col items-center p-2 border-l border-slate-200">
            <Calendar className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-lg">{new Date(scholarship.deadline).toLocaleDateString()}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Deadline</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">About the Scholarship</h3>
            <p className="text-slate-600 leading-relaxed">{scholarship.description}</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">Eligibility Criteria</h3>
            <ul className="space-y-2">
              {scholarship.eligibility.map((item: string, i: number) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Action Button */}
        <div className="mt-10 pt-6 border-t flex justify-end">
          <Button size="lg" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
            Apply Now on Official Site
          </Button>
        </div>

      </div>
    </div>
  );
}