import { ScholarshipCard } from "@/components/ScholarshipCard";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  const scholarships = [
    { id: "1", title: "HDFC Badhte Kadam", provider: "HDFC Bank", amount: 100000, location: "Pan-India", deadline: new Date("2026-03-31"), tags: ["Undergraduate", "Need-based"] },
    { id: "2", title: "Tata Capital Pankh", provider: "Tata Capital", amount: 12000, location: "Maharashtra", deadline: new Date("2026-04-15"), tags: ["School", "Merit-based"] },
    { id: "3", title: "Google Generation Scholarship", provider: "Google", amount: 250000, location: "Online", deadline: new Date("2026-05-10"), tags: ["Women in Tech", "Computer Science"] },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-10 bg-slate-50 gap-8">
      {/* --- NEW NAVBAR SECTION --- */}
      <nav className="w-full max-w-6xl flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">scholarLogic</h1>
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton showName />
          </SignedIn>
        </div>
      </nav>
      {/* -------------------------- */}

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Scholarship Portal</h1>
        <p className="text-slate-500">Your centralized platform for financial aid.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {scholarships.map((scholarship) => (
          <ScholarshipCard key={scholarship.id} {...scholarship} />
        ))}
      </div>
    </main>
  );
}