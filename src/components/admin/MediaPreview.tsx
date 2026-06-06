"use client";

import Image from "next/image";
import { Music } from "lucide-react";
import { getImageNameFromPath } from "@/lib/imageUtils";

const isAudioPath = (path: string | null) =>
  !!path && /\.(mp3|wav|ogg|m4a)$/i.test(path);

type MediaPreviewProps = {
  src: string | null;
  label: string;
  size?: "sm" | "md" | "admin";
};

export default function MediaPreview({ src, label, size = "md" }: MediaPreviewProps) {
  const boxClass =
    size === "sm" ? "h-24 w-24" : size === "admin" ? "h-36 w-36" : "h-36 w-36";
  const name = getImageNameFromPath(src);

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
