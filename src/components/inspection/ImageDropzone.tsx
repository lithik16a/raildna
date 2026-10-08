"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/utils/cn";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export function ImageDropzone({
  previewUrl,
  fileName,
  onFile,
  onClear,
  onError,
}: {
  previewUrl: string | null;
  fileName: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handle(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return onError("Unsupported file type. Upload a PNG, JPEG or WebP image.");
    if (file.size > MAX_BYTES) return onError("Image is too large (max 8 MB).");
    onFile(file);
  }

  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="Selected inspection image preview" className="mx-auto max-h-64 w-full object-contain" />
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <span className="truncate">{fileName}</span>
          <button onClick={onClear} className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-red-600">
            <X className="h-3.5 w-3.5" aria-hidden /> Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files?.[0]); }}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
        dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400",
      )}
    >
      <ImagePlus className="mb-2 h-8 w-8 text-slate-400" aria-hidden />
      <p className="text-sm font-medium text-slate-800">Upload Railway Component Image</p>
      <p className="mt-1 text-xs text-slate-500">Drag and drop, or browse. PNG, JPEG or WebP, up to 8 MB.</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Browse files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        aria-label="Inspection image file"
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}
