"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Music } from "lucide-react";
import { getImageNameFromPath, isAudioPath } from "@/lib/imageUtils";
import { isTextPath } from "@/lib/mediaPreload";

type MediaPreviewProps = {
  src: string | null;
  label: string;
  size?: "sm" | "md" | "admin";
};

export default function MediaPreview({ src, label, size = "md" }: MediaPreviewProps) {
  const isAdmin = size === "admin";
  const boxClass =
    size === "sm"
      ? "h-24 w-24"
      : isAdmin
        ? "h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36"
        : "h-36 w-36";
  const wrapClass = isAdmin ? "w-20 sm:w-28 md:w-36" : "";
  const name = getImageNameFromPath(src);
  const [textPreview, setTextPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!src || !isTextPath(src)) {
      setTextPreview(null);
      return;
    }
    let cancelled = false;
    void fetch(src)
      .then(res => res.text())
      .then(text => {
        if (!cancelled) setTextPreview(text.trim());
      })
      .catch(() => {
        if (!cancelled) setTextPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className={`flex min-w-0 flex-col items-center gap-1 sm:gap-2 ${wrapClass}`}>
      <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">{label}</span>
      <div
        className={`relative ${boxClass} overflow-hidden rounded-lg border bg-muted flex items-center justify-center`}
      >
        {!src ? (
          <span className="text-[10px] text-muted-foreground px-1 text-center sm:text-xs sm:px-2">Brak</span>
        ) : isAudioPath(src) ? (
          <div className="flex flex-col items-center gap-0.5 text-muted-foreground sm:gap-1">
            <Music className="h-5 w-5 sm:h-8 sm:w-8" />
            <span className="max-w-full px-0.5 text-center text-[9px] leading-tight line-clamp-2 sm:text-[10px] sm:px-1">
              {name}
            </span>
          </div>
        ) : isTextPath(src) ? (
          <div className="flex flex-col items-center gap-0.5 px-1 text-muted-foreground sm:gap-1 sm:px-2">
            <FileText className="h-4 w-4 shrink-0 sm:h-6 sm:w-6" />
            <span className="text-center text-[10px] font-bold leading-tight text-foreground line-clamp-3 sm:text-sm sm:line-clamp-2">
              {textPreview ?? "…"}
            </span>
          </div>
        ) : (
          <Image
            key={src}
            src={src}
            alt={name}
            fill
            className="object-contain"
            unoptimized
          />
        )}
      </div>
      <span
        className={`w-full text-center font-semibold leading-tight line-clamp-2 ${
          isAdmin ? "text-[10px] sm:text-sm md:text-base" : "max-w-[9rem] truncate text-sm"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
