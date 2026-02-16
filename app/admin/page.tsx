import { createScholarship } from "@/actions/scholarship";

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-8">Post New Scholarship (Admin)</h1>
      
      <form action={createScholarship} className="space-y-6 bg-white p-6 rounded-xl shadow-md border">
        
        {/* Basic Info */}
        <div>
          <label className="block font-medium mb-1">Scholarship Title</label>
          <input name="title" type="text" placeholder="e.g. Super Smart Scholarship" className="w-full p-2 border rounded" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Provider</label>
            <input name="provider" type="text" placeholder="Thapar University" className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Amount (₹)</label>
            <input name="amount" type="number" placeholder="50000" className="w-full p-2 border rounded" required />
          </div>
        </div>

        {/* 👇 NEW SECTION: ELIGIBILITY CRITERIA 👇 */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-3">Eligibility Logic (The "Judge")</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-900">Min. CGPA Required</label>
              <input 
                name="minCGPA" 
                type="number" 
                step="0.1" 
                placeholder="e.g. 8.5" 
                className="w-full p-2 border rounded" 
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if no CGPA limit.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-900">Max. Family Income (₹)</label>
              <input 
                name="minIncome" // We use 'minIncome' field name for 'Income Ceiling' in the DB
                type="number" 
                placeholder="e.g. 600000" 
                className="w-full p-2 border rounded" 
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if open to all.</p>
            </div>
          </div>
        </div>

        {/* Standard Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Location</label>
            <input name="location" type="text" placeholder="Pan-India" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Deadline</label>
            <input name="deadline" type="date" className="w-full p-2 border rounded" required />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Application Link</label>
          <input name="applyLink" type="url" placeholder="https://..." className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">Brief Description</label>
          <textarea name="description" rows={4} className="w-full p-2 border rounded" required />
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
          Push to scholarLogic Database
        </button>
      </form>
    </div>
  );
}