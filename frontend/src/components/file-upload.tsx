"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, FileText, Image } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [rejection, setRejection] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      setRejection(null);
      if (accepted.length > 0) {
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const r = rejections[0];
    if (!r) return;
    const code = r.errors[0]?.code;
    if (code === "file-too-large") {
      setRejection("File exceeds 10MB limit. Please use a smaller file.");
    } else if (code === "file-invalid-type") {
      setRejection(
        "Unsupported format. Please use PNG, JPG, TIFF, WebP, or PDF."
      );
    } else {
      setRejection("File could not be accepted. Please try another.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/tiff": [".tiff", ".tif"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isProcessing,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer
          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 text-muted-foreground">
            <Upload className="w-8 h-8" />
            <FileText className="w-8 h-8" />
            <Image className="w-8 h-8" />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">
              Drop your document here...
            </p>
          ) : (
            <>
              <p className="text-lg font-medium">
                Drop a document here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, TIFF, WebP, or PDF up to 10MB
              </p>
            </>
          )}
        </div>
      </div>
      {rejection && (
        <p role="alert" className="mt-2 text-sm text-destructive text-center">
          {rejection}
        </p>
      )}
    </div>
  );
}
