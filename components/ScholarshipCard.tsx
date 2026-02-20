"use client";

import { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, IndianRupee, FileText } from "lucide-react";
import Link from "next/link";

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
}: ScholarshipCardProps) {
  const formatAmount = () => {
    if (amountType === "WAIVER") return "Tuition Waiver";
    if (amount && amount > 0) return `₹${amount.toLocaleString("en-IN")}`;
    return "Not specified";
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const getDeadlineText = () => {
    if (!deadline) return "No deadline";
    if (!mounted) return ""; // Return empty during SSR to avoid hydration mismatch
    const date = new Date(deadline);
    return date.toLocaleDateString();
  };

  const openPdf = () => {
    if (sourcePdf) {
      // Use API route to serve PDF with proper headers
      const pdfUrl = `/api/pdf/${sourcePdf}`;
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-all border-l-4 border-l-blue-600 flex flex-col justify-between">
      <div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {provider}
              </p>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
            </div>
            <Badge variant={amountType === "WAIVER" ? "secondary" : amount && amount > 50000 ? "default" : "outline"}>
              {amountType === "WAIVER" ? "Waiver" : amount && amount > 50000 ? "High Value" : "Standard"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center text-slate-700">
            <IndianRupee className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-lg font-bold">
              {formatAmount()}
            </span>
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

          {(courseRestriction || categoryRestriction || yearRestriction || minCGPA || maxIncome) && (
            <div className="space-y-1 text-xs text-slate-600">
              {courseRestriction && <div>• Course: {courseRestriction}</div>}
              {categoryRestriction && <div>• Category: {categoryRestriction}</div>}
              {yearRestriction && <div>• Year: {yearRestriction}</div>}
              {minCGPA && <div>• Min CGPA: {minCGPA}</div>}
              {maxIncome && <div>• Max Income: ₹{maxIncome.toLocaleString("en-IN")}</div>}
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

      <CardFooter className="flex gap-2">
        <Link href={`/scholarship/${id}`} className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            View Details
          </Button>
        </Link>
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