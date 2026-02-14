import { ScholarshipCard } from "@/components/ScholarshipCard";

export default function Home() {
  // This is "Mock Data". Later, we will replace this with: 
  // const scholarships = await db.scholarship.findMany();
  const scholarships = [
    {
      title: "HDFC Badhte Kadam",
      provider: "HDFC Bank",
      amount: 100000,
      location: "Pan-India",
      deadline: new Date("2026-03-31"),
      tags: ["Undergraduate", "Need-based"],
    },
    {
      title: "Tata Capital Pankh",
      provider: "Tata Capital",
      amount: 12000,
      location: "Maharashtra",
      deadline: new Date("2026-04-15"),
      tags: ["Class 11-12", "Merit-based"],
    },
    {
      title: "Google Generation Scholarship",
      provider: "Google",
      amount: 250000,
      location: "Online",
      deadline: new Date("2026-05-10"),
      tags: ["Women in Tech", "Computer Science"],
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-10 bg-slate-50 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          ScholarSync Portal
        </h1>
        <p className="text-slate-500">
          Your centralized platform for financial aid.
        </p>
      </div>

      {/* The Grid: This makes them look nice side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {scholarships.map((scholarship, index) => (
          <ScholarshipCard
            key={index}
            title={scholarship.title}
            provider={scholarship.provider}
            amount={scholarship.amount}
            location={scholarship.location}
            deadline={scholarship.deadline}
            tags={scholarship.tags}
          />
        ))}
      </div>
    </main>
  );
}