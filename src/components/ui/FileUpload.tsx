"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/constants";

interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface FileUploadProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  accept?: string;
  onUpload?: (result: UploadResult) => void;
  onRemove?: () => void;
  value?: UploadResult | null;
}

export default function FileUpload({
  label,
  error,
  hint,
  required,
  accept = ".jpg,.jpeg,.png,.pdf",
  onUpload,
  onRemove,
  value,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and PDF files are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File must be under 5MB";
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploadError(null);
      setUploading(true);

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        onUpload?.({
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
        });
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Upload failed. Please try again.",
        );
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      // Reset so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadFile],
  );

  const handleRemove = () => {
    setPreview(null);
    setUploadError(null);
    onRemove?.();
  };

  const displayError = error || uploadError;
  const isPdf = value?.mimeType === "application/pdf";

  // Show uploaded state
  if (value) {
    return (
      <div className="space-y-1.5">
        {label && (
          <span className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </span>
        )}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
          {preview && !isPdf ? (
            <img
              src={preview}
              alt="Preview"
              className="h-14 w-14 rounded object-cover border border-gray-200"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-100 text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {value.fileName}
            </p>
            <p className="text-xs text-gray-500">
              {(value.fileSize / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-danger transition-colors"
            aria-label="Remove file"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {displayError && (
          <p className="text-sm text-danger">{displayError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <span className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6
          cursor-pointer transition-colors duration-150
          ${
            dragging
              ? "border-brand-green bg-brand-green-light"
              : displayError
                ? "border-danger/40 bg-danger-light"
                : "border-gray-300 bg-white hover:border-brand-green hover:bg-brand-green-light/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <>
            <svg
              className="h-10 w-10 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-brand-green">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, or PDF (max 5MB)
            </p>
          </>
        )}
      </div>
      {displayError && (
        <p className="text-sm text-danger">{displayError}</p>
      )}
      {hint && !displayError && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}
