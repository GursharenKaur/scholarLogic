import { createScholarship } from "@/actions/scholarship";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto p-10 bg-white shadow-md rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-6">Post New Scholarship (Admin)</h1>
      
      <form action={createScholarship} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Scholarship Title</label>
          <input name="title" className="w-full border p-2 rounded" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <input name="provider" className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Amount (₹)</label>
            <input name="amount" type="number" className="w-full border p-2 rounded" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input name="location" className="w-full border p-2 rounded" placeholder="Pan-India" />
          </div>
          <div>
            <label className="block text-sm font-medium">Deadline</label>
            <input name="deadline" type="date" className="w-full border p-2 rounded" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Application Link</label>
          <input name="applyLink" type="url" className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label className="block text-sm font-medium">Brief Description</label>
          <textarea name="description" className="w-full border p-2 rounded h-24" />
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">
          Push to scholarLogic Database
        </Button>
      </form>
    </div>
  );
}