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

  useEffect(() => { setMounted(true); }, []);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    startTransition(async () => {
      const result = await toggleSaveScholarship(id);
      if (!result.success) {
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
    return new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const openPdf = () => {
    if (sourcePdf) window.open(`/api/pdf/${sourcePdf}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className={cn(
      "w-full transition-all border-l-4 flex flex-col justify-between relative overflow-hidden",
      "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      "hover:shadow-xl hover:-translate-y-0.5 duration-200",
      isEligible === false
        ? "border-l-slate-300 dark:border-l-slate-700 opacity-75"
        : "border-l-blue-600 dark:border-l-blue-500"
    )}>
      <div>
        {/* Eligibility pill */}
        {isEligible !== undefined && (
          <div className={cn(
            "absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm border",
            isEligible
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
          )}>
            {isEligible ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0" />}
            {isEligible ? "Eligible" : "Not Eligible"}
          </div>
        )}

        <CardHeader className="pb-2">
          {/* Heart/Save button */}
          <button
            onClick={handleSave}
            disabled={isPending}
            title={isSaved ? "Remove from saved" : "Save scholarship"}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200 group z-10",
              "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90",
              isPending ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            <Heart className={cn(
              "w-5 h-5 transition-all duration-200",
              isSaved
                ? "fill-red-500 text-red-500 scale-110"
                : "text-slate-400 dark:text-slate-500 group-hover:text-red-400 group-hover:scale-110"
            )} />
          </button>

          <div className={cn("pr-10", isEligible !== undefined ? "pl-1 pt-5" : "")}>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{provider}</p>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{title}</CardTitle>
          </div>

          <Badge
            className="mt-2 self-start"
            variant={amountType === "WAIVER" ? "secondary" : amount && amount > 50000 ? "default" : "outline"}
          >
            {amountType === "WAIVER" ? "Waiver" : amount && amount > 50000 ? "High Value" : "Standard"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center text-slate-700 dark:text-slate-200">
            <IndianRupee className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            <span className="text-lg font-bold">{formatAmount()}</span>
          </div>

          <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {getDeadlineText()}
            </div>
          </div>

          {(courseRestriction || categoryRestriction || yearRestriction || minCGPA || maxIncome) && (
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-500">
              {courseRestriction && <div>• Course: {courseRestriction}</div>}
              {categoryRestriction && <div>• Category: {categoryRestriction}</div>}
              {yearRestriction && <div>• Year: {yearRestriction}</div>}
              {minCGPA && <div>• Min CGPA: {minCGPA}</div>}
              {maxIncome && <div>• Max Income: ₹{maxIncome.toLocaleString("en-IN")}</div>}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag, i) => (
              <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex gap-2 pt-2">
        <div className="flex-1">
          <SignedIn>
            <Link href={`/scholarship/${id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">View Details</Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" fallbackRedirectUrl={`/scholarship/${id}`}>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-9 px-4 py-2 w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                View Details
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {sourcePdf && (
          <Button onClick={openPdf} variant="outline" className="px-3 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="View Source PDF">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}