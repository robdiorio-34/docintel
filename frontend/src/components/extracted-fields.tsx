"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ExtractedField } from "@/lib/types";

interface ExtractedFieldsProps {
  fields: ExtractedField[];
}

function confidenceColor(c: number): string {
  if (c >= 0.9) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (c >= 0.75) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

export function ExtractedFields({ fields }: ExtractedFieldsProps) {
  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No structured fields could be extracted from this document.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Extracted Fields
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({fields.length} found)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Field</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[100px] text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, i) => (
              <TableRow key={`${field.field}-${i}`}>
                <TableCell className="font-medium text-sm">
                  {field.field}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {field.value}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={`text-xs ${confidenceColor(field.confidence)}`}
                  >
                    {Math.round(field.confidence * 100)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
