"use client";

import { useState, useCallback, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { KeyFields } from "@/components/key-fields";
import { ResultsCard } from "@/components/results-card";
import { ExtractedFields } from "@/components/extracted-fields";
import { OcrText } from "@/components/ocr-text";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  RotateCcw,
  RefreshCw,
  FileText,
  Receipt,
  Github,
} from "lucide-react";
import type { ProcessingResult } from "@/lib/types";

const SAMPLE_DOCS = [
  {
    name: "Invoice",
    path: "/samples/invoice.png",
    icon: FileText,
    description: "Acme Technologies - $5,184.00",
  },
  {
    name: "Receipt",
    path: "/samples/receipt.png",
    icon: Receipt,
    description: "Metro Office Supply - $94.82",
  },
];

export default function Home() {
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const processFile = useCallback(async (file: File) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    lastFileRef.current = file;

    // Revoke previous preview URL to avoid memory leak
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ detail: "Processing failed" }));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data: ProcessingResult = await res.json();
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processSample = useCallback(
    async (samplePath: string, sampleName: string) => {
      try {
        const res = await fetch(samplePath);
        const blob = await res.blob();
        const file = new File(
          [blob],
          sampleName.toLowerCase().replace(/ /g, "_") + ".png",
          { type: "image/png" }
        );
        processFile(file);
      } catch {
        setError(`Failed to load sample "${sampleName}"`);
      }
    },
    [processFile]
  );

  const retry = () => {
    if (lastFileRef.current) processFile(lastFileRef.current);
  };

  const reset = () => {
    abortRef.current?.abort();
    if (preview) URL.revokeObjectURL(preview);
    setResult(null);
    setPreview(null);
    setFileName(null);
    setError(null);
    lastFileRef.current = null;
  };

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">DocIntel</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            AI-powered document classification and data extraction. Upload any
            document to identify its type and extract structured fields
            automatically.
          </p>
        </div>

        {/* Upload Section */}
        <FileUpload onFileSelect={processFile} isProcessing={isProcessing} />

        {/* Sample Documents */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground text-center mb-3">
            No document handy? Try a sample:
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {SAMPLE_DOCS.map((doc) => (
              <button
                key={doc.name}
                onClick={() => processSample(doc.path, doc.name)}
                disabled={isProcessing}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <doc.icon className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <div className="text-sm font-medium">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between gap-3"
          >
            <span>{error}</span>
            <div className="flex gap-2 shrink-0">
              {lastFileRef.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retry}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-destructive"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isProcessing && (
          <div className="mt-8 space-y-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Processing {fileName}...
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Cancel
              </Button>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {/* Results */}
        {result && !isProcessing && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Results for {fileName}
              </h2>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Process Another
              </Button>
            </div>

            <Separator />

            {/* Document Preview + Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preview && (
                <div className="rounded-lg border overflow-hidden bg-muted/30">
                  <img
                    src={preview}
                    alt={`Preview of ${fileName}`}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              )}
              <div className={preview ? "" : "md:col-span-2"}>
                <ResultsCard result={result} />
              </div>
            </div>

            {/* Key Fields Summary */}
            <KeyFields fields={result.extracted_fields} />

            {/* All Extracted Fields */}
            <ExtractedFields fields={result.extracted_fields} />

            {/* Raw OCR Text */}
            <OcrText text={result.ocr_text} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
          <p>
            DocIntel — Document Intelligence Pipeline
          </p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github className="w-3 h-3" />
              View Source
            </a>
            <span className="mx-2">|</span>
            PyTorch + docTR + spaCy + FastAPI + Next.js
          </p>
        </div>
      </div>
    </main>
  );
}
