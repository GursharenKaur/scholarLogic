"use client"; // <--- Required for onClick events

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, IndianRupee, Heart } from "lucide-react";
import Link from "next/link";
import { toggleSaveScholarship } from "@/actions/application"; // <--- Import your new action
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface ScholarshipCardProps {
  id: string;
  title: string;
  provider: string;
  amount?: number | null;
  location: string;
  deadline: Date;
  tags?: string[];
  isSavedInitial?: boolean; // <--- To show if user already saved it
}

export function ScholarshipCard({
  id,
  title,
  provider,
  amount,
  location,
  deadline,
  tags = [],
  isSavedInitial = false,
}: ScholarshipCardProps) {
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the link if we put one
    
    // Optimistic UI update
    setIsSaved(!isSaved);

    startTransition(async () => {
      const result = await toggleSaveScholarship(id);
      if (!result.success) {
        // Revert if the server action fails
        setIsSaved(isSaved);
        alert(result.error || "Failed to save scholarship");
      }
    });
  };

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-all border-l-4 border-l-blue-600 flex flex-col justify-between relative">
      <div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="pr-8">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {provider}
              </p>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
            </div>
            
            {/* Save Button Overlay */}
            <button 
              onClick={handleSave}
              disabled={isPending}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors group"
            >
              <Heart 
                className={cn(
                  "w-6 h-6 transition-colors",
                  isSaved ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-red-400"
                )} 
              />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center text-slate-700">
            <IndianRupee className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-2xl font-bold">
              {amount ? amount.toLocaleString("en-IN") : "N/A"}
            </span>
            <span className="text-sm text-muted-foreground ml-1">/ year</span>
          </div>

          <div className="flex gap-4 text-sm text-slate-500">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(deadline).toLocaleDateString("en-US")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2">
        <Link href={`/scholarship/${id}`} className="w-full">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}