"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, Hash } from "lucide-react";
import type { ExtractedField } from "@/lib/types";

interface KeyFieldsProps {
  fields: ExtractedField[];
}

const KEY_FIELD_CONFIG = [
  {
    match: (f: ExtractedField) => f.field === "Total",
    label: "Total Amount",
    icon: DollarSign,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    match: (f: ExtractedField) => f.field === "Date",
    label: "Document Date",
    icon: Calendar,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    match: (f: ExtractedField) => f.field === "Invoice Number",
    label: "Reference",
    icon: Hash,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
];

export function KeyFields({ fields }: KeyFieldsProps) {
  const keyFields = KEY_FIELD_CONFIG.map((config) => {
    const found = fields.find(config.match);
    return found ? { ...config, value: found.value } : null;
  }).filter(Boolean) as (typeof KEY_FIELD_CONFIG[number] & { value: string })[];

  if (keyFields.length === 0) return null;

  return (
    <div
      className={`grid gap-3 ${
        keyFields.length === 1
          ? "grid-cols-1"
          : keyFields.length === 2
            ? "grid-cols-2"
            : "grid-cols-3"
      }`}
    >
      {keyFields.map((kf) => (
        <Card key={kf.label} className={`${kf.bg} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <kf.icon className={`w-4 h-4 ${kf.color}`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {kf.label}
              </span>
            </div>
            <div className={`text-xl font-bold ${kf.color} font-mono`}>
              {kf.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
