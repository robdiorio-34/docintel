"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

interface OcrTextProps {
  text: string;
}

export function OcrText({ text }: OcrTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            OCR Output
            <span className="text-xs font-normal text-muted-foreground">
              ({text.length} chars)
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="ocr-content"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent id="ocr-content">
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
            {text || "No text extracted"}
          </pre>
        </CardContent>
      )}
    </Card>
  );
}
