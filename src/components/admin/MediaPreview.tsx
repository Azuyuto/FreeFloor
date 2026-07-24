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
  const boxClass =
    size === "sm" ? "h-24 w-24" : size === "admin" ? "h-36 w-36" : "h-36 w-36";
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
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className={`relative ${boxClass} overflow-hidden rounded-lg border bg-muted flex items-center justify-center`}
      >
        {!src ? (
          <span className="text-xs text-muted-foreground px-2 text-center">Brak</span>
        ) : isAudioPath(src) ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Music className="h-8 w-8" />
            <span className="text-[10px] px-1 text-center truncate max-w-full">{name}</span>
          </div>
        ) : isTextPath(src) ? (
          <div className="flex flex-col items-center gap-1 px-2 text-muted-foreground">
            <FileText className="h-6 w-6" />
            <span className="text-sm font-bold text-foreground text-center line-clamp-2">
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
        className={`text-center font-semibold truncate ${
          size === "admin" ? "max-w-[10rem] text-base" : "max-w-[9rem] text-sm"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
