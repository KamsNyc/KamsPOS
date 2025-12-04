"use client";

import { useState, useRef } from "react";
import { Upload01, XClose, Image01 } from "@untitledui/icons";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  shape?: "square" | "circle";
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "misc",
  className = "",
  size = "md",
  shape = "square",
  placeholder = "Upload Image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded"
            className={`${sizeClasses[size]} ${shape === "circle" ? "rounded-full" : "rounded-xl"} object-cover border-2 border-neutral-700`}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <XClose className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`absolute inset-0 ${shape === "circle" ? "rounded-full" : "rounded-xl"} bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <Upload01 className="w-6 h-6 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`${sizeClasses[size]} ${shape === "circle" ? "rounded-full" : "rounded-xl"} border-2 border-dashed border-neutral-700 hover:border-emerald-500/50 bg-neutral-900 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50`}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Image01 className="w-5 h-5 text-neutral-500" />
              <span className="text-[9px] text-neutral-500 text-center px-1">{placeholder}</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

