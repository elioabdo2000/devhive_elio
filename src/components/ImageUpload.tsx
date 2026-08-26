"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/Toast";

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  folder: "blog-covers" | "community-covers" | "avatars";
  shape?: "square" | "wide";
  error?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUpload({ label, value, onChange, folder, shape = "wide", error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError("");

    if (file.size > MAX_BYTES) {
      setLocalError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();

      if (!json.success) {
        setLocalError(json.message ?? "Upload failed");
        showToast("error", json.message ?? "Upload failed");
        return;
      }

      onChange(json.data.url);
      showToast("success", "Image uploaded");
    } catch {
      setLocalError("Network error — please try again");
      showToast("error", "Network error — please try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewWrapperClass =
    shape === "square"
      ? "relative mb-2 h-20 w-20 overflow-hidden rounded-full border border-border"
      : "relative mb-2 h-32 w-full overflow-hidden rounded-lg border border-border";

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>

      {value && (
        <div className={previewWrapperClass}>
          <Image src={value} alt="" fill className="object-cover" sizes={shape === "square" ? "80px" : "100vw"} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal disabled:opacity-50"
        >
          {uploading ? "Uploading..." : value ? "Change image" : "Upload from computer"}
        </button>
        {value && !uploading && (
          <button type="button" onClick={() => onChange("")} className="text-sm text-red-600 hover:underline">
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label={label}
      />

      {(localError || error) && <p className="mt-1 text-xs text-red-600">{localError || error}</p>}
    </div>
  );
}
