"use client";

import { useState, useEffect, useTransition } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { CheckCircle, XCircle, Calendar, MapPin, IndianRupee, Heart, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toggleSaveScholarship } from "@/actions/application";
import { cn } from "@/lib/utils";

interface ScholarshipCardProps {
  id: string;
  title: string;
  provider: string;
  amount?: number;
  amountType?: "CASH" | "WAIVER";
  location?: string;
  deadline?: Date;
  tags?: string[];
  courseRestriction?: string;
  categoryRestriction?: string;
  yearRestriction?: string;
  minCGPA?: number;
  maxIncome?: number;
  sourcePdf?: string;
  isSavedInitial?: boolean;
  isEligible?: boolean;
}

export function ScholarshipCard({
  id,
  title,
  provider,
  amount,
  amountType,
  location = "Pan-India",
  deadline,
  tags = [],
  courseRestriction,
  categoryRestriction,
  yearRestriction,
  minCGPA,
  maxIncome,
  sourcePdf,
  isSavedInitial = false,
  isEligible,
}: ScholarshipCardProps) {
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    startTransition(async () => {
      const result = await toggleSaveScholarship(id);
      if (!result.success) {
        // Revert optimistic update using the captured value (fixes stale closure)
        setIsSaved(!newSavedState);
        if (result.error?.includes("signed in")) {
          alert("Please sign in to save scholarships.");
        } else {
          alert(result.error || "Failed to save scholarship. Please try again.");
        }
      }
    });
  };

  const formatAmount = () => {
    if (amountType === "WAIVER") return "Tuition Waiver";
    if (amount && amount > 0) return `₹${amount.toLocaleString("en-IN")}`;
    return "Not specified";
  };

  const getDeadlineText = () => {
    if (!deadline) return "No deadline";
    if (!mounted) return "";
    return new Date(deadline).toLocaleDateString();
  };

  const openPdf = () => {
    if (sourcePdf) {
      window.open(`/api/pdf/${sourcePdf}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className={cn(
      "w-full max-w-md transition-all border-l-4 flex flex-col justify-between relative overflow-hidden",
      "hover:shadow-xl hover:-translate-y-0.5 duration-200",
      isEligible === false
        ? "border-l-slate-300 opacity-75"
        : "border-l-blue-600"
    )}>
      <div>
        {/* Eligibility pill — absolute, top-left corner */}
        {isEligible !== undefined && (
          <div
            className={cn(
              "absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm border",
              isEligible
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            )}
          >
            {isEligible
              ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
              : <XCircle className="w-3 h-3 flex-shrink-0" />}
            {isEligible ? "Eligible" : "Not Eligible"}
          </div>
        )}

        <CardHeader className="pb-2">
          {/* Heart/Save — absolute so it never displaces other elements */}
          <button
            onClick={handleSave}
            disabled={isPending}
            title={isSaved ? "Remove from saved" : "Save scholarship"}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200 group z-10",
              isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-100 active:scale-90"
            )}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-all duration-200",
                isSaved
                  ? "fill-red-500 text-red-500 scale-110"
                  : "text-slate-400 group-hover:text-red-400 group-hover:scale-110"
              )}
            />
          </button>

          {/* Provider + Title — padded on both sides: left for badge, right for heart */}
          <div className={cn("pr-10", isEligible !== undefined ? "pl-1 pt-5" : "")}>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {provider}
            </p>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
          </div>

          {/* Badge — left-aligned below title, never floated right */}
          <Badge
            className="mt-2 self-start"
            variant={
              amountType === "WAIVER"
                ? "secondary"
                : amount && amount > 50000
                  ? "default"
                  : "outline"
            }
          >
            {amountType === "WAIVER"
              ? "Waiver"
              : amount && amount > 50000
                ? "High Value"
                : "Standard"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center text-slate-700">
            <IndianRupee className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-lg font-bold">{formatAmount()}</span>
          </div>

          <div className="flex gap-4 text-sm text-slate-500">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {getDeadlineText()}
            </div>
          </div>

          {(courseRestriction ||
            categoryRestriction ||
            yearRestriction ||
            minCGPA ||
            maxIncome) && (
              <div className="space-y-1 text-xs text-slate-600">
                {courseRestriction && <div>• Course: {courseRestriction}</div>}
                {categoryRestriction && (
                  <div>• Category: {categoryRestriction}</div>
                )}
                {yearRestriction && <div>• Year: {yearRestriction}</div>}
                {minCGPA && <div>• Min CGPA: {minCGPA}</div>}
                {maxIncome && (
                  <div>• Max Income: ₹{maxIncome.toLocaleString("en-IN")}</div>
                )}
              </div>
            )}

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

      <CardFooter className="flex gap-2 pt-2">
        <div className="flex-1">
          {/* If the user IS signed in, this acts as a normal link to the details page */}
          <SignedIn>
            <Link href={`/scholarship/${id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Details
              </Button>
            </Link>
          </SignedIn>

          {/* If the user is NOT signed in, the button is still visible, but clicking it opens the Sign In modal */}
          <SignedOut>
            <SignInButton mode="modal" fallbackRedirectUrl={`/scholarship/${id}`}>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 w-full bg-blue-600 text-white hover:bg-blue-700">
                View Details
              </button>
            </SignInButton>
          </SignedOut>
        </div>
        
        {sourcePdf && (
          <Button
            onClick={openPdf}
            variant="outline"
            className="px-3"
            title="View Source PDF"
          >
            <FileText className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}