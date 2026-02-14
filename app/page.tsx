import { ScholarshipCard } from "@/components/ScholarshipCard";
import connectDB from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";

export default async function Home() {
  // 1. Establish the connection
  await connectDB();
  
  // 2. Fetch ALL scholarships from your real MongoDB
  // We use .lean() to make it a plain JavaScript object for faster performance
  const scholarships = await Scholarship.find({}).sort({ createdAt: -1 }).lean();

  return (
    <main className="flex min-h-screen flex-col items-center p-10 bg-slate-50 gap-8">
      {/* Navbar */}
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

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Real-Time Scholarships</h1>
        <p className="text-slate-500">Currently showing {scholarships.length} active opportunities from our database.</p>
      </div>

      {/* 3. Render the REAL cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {scholarships.map((s: any) => (
          <ScholarshipCard 
            key={s._id.toString()} 
            id={s._id.toString()}
            title={s.title}
            provider={s.provider}
            amount={s.amount}
            location={s.location}
            deadline={s.deadline}
            tags={s.tags.length > 0 ? s.tags : ["New"]}
          />
        ))}
      </div>
      
      {/* Admin Quick Link (Temp) */}
      <footer className="mt-10">
        <a href="/admin" className="text-xs text-slate-400 hover:text-blue-500 transition-colors">
          Admin Portal (Database Access)
        </a>
      </footer>
    </main>
  );
}