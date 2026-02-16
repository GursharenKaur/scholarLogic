import { saveUserProfile } from "@/actions/user";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold mb-2">Complete Your Profile 🎓</h1>
      <p className="text-gray-500 mb-8">
        Help us find the best scholarships for you.
      </p>

      <form action={saveUserProfile} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border">
        
        {/* Course Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Course / Major</label>
          <input 
            name="course" 
            type="text" 
            placeholder="e.g. B.Tech CSE"
            className="w-full p-2 border rounded-md"
            required 
          />
        </div>

        {/* CGPA Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Current CGPA</label>
          <input 
            name="cgpa" 
            type="number" 
            step="0.01" 
            min="0" 
            max="10" 
            placeholder="e.g. 7.5"
            className="w-full p-2 border rounded-md"
            required 
          />
          <p className="text-xs text-gray-400 mt-1">Don't lie! We check. 😉</p>
        </div>

        {/* Income Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Annual Family Income (₹)</label>
          <input 
            name="income" 
            type="number" 
            placeholder="e.g. 400000"
            className="w-full p-2 border rounded-md"
            required 
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Save & Find Scholarships
        </button>
      </form>
    </div>
  );
}