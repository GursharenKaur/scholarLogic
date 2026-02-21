import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Application from "@/models/Application";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { DocumentVault } from "@/components/DocumentVault";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Bookmark, Send, Trophy, FileText } from "lucide-react";

export default async function DashboardPage() {
  // 1. Auth Guard
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  await connectToDatabase();

  // 2. Fetch User's Applications/Saves + their profile (for documents)
  const [applications, userProfile] = await Promise.all([
    Application.find({ clerkId: userId }).populate("scholarshipId").lean(),
    User.findOne({ clerkId: userId }).lean(),
  ]);

  // 3. Categorize scholarship data
  const saved = (applications as any[]).filter((app) => app.status === "Saved");
  const applied = (applications as any[]).filter((app) => app.status === "Applied");
  const won = (applications as any[]).filter((app) => app.status === "Won");

  // 4. Serialize documents for the client component
  const documents = ((userProfile as any)?.documents ?? []).map((doc: any) => ({
    _id: doc._id?.toString(),
    type: doc.type,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    publicId: doc.publicId ?? "",
    uploadedAt: doc.uploadedAt?.toISOString?.() ?? null,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-muted-foreground text-lg">
          Manage your documents and track your scholarship journey.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saved</CardTitle>
            <Bookmark className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saved.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <Send className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applied.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Wins</CardTitle>
            <Trophy className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{won.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Doc Vault</CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">documents stored</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="documents">My Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="pt-6">
          {saved.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {saved.map((app: any) => (
                <ScholarshipCard
                  key={app._id}
                  id={app.scholarshipId._id.toString()}
                  title={app.scholarshipId.title}
                  provider={app.scholarshipId.provider}
                  amount={app.scholarshipId.amount}
                  location={app.scholarshipId.location}
                  deadline={app.scholarshipId.deadline}
                  tags={app.scholarshipId.tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No saved scholarships yet. Go explore!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="pt-6">
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">Tracking for applied scholarships coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="won" className="pt-6">
          <div className="text-center py-20 bg-green-50 border-2 border-green-200 border-dashed rounded-xl">
            <p className="text-green-700 font-medium">Your successful awards will appear here!</p>
          </div>
        </TabsContent>

        {/* ✅ Document Vault tab — now live */}
        <TabsContent value="documents" className="pt-6">
          <DocumentVault documents={documents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}