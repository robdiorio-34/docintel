"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Zap } from "lucide-react";
import type { ProcessingResult } from "@/lib/types";

interface ResultsCardProps {
  result: ProcessingResult;
}

const TYPE_COLORS: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  budget: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  form: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  letter: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  memo: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resume: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  email: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  receipt: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  report: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  specification: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

function confidenceBarColor(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 75) return "bg-yellow-500";
  return "bg-red-500";
}

export function ResultsCard({ result }: ResultsCardProps) {
  const confidencePercent = Math.round(result.confidence * 100);
  const colorClass =
    TYPE_COLORS[result.document_type] || "bg-muted text-muted-foreground";
  const barColor = confidenceBarColor(confidencePercent);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Classification
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <Clock className="w-4 h-4" />
            {(result.processing_time_ms / 1000).toFixed(1)}s
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge className={`text-sm px-3 py-1 ${colorClass}`}>
            {result.document_type.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" /> Confidence
            </span>
            <span className="font-mono font-medium">{confidencePercent}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
