// src/app/game/[gameId]/view/page.tsx
"use client";
import Image from "next/image";
import { useGameStore } from "@/stores/useGameStore";

export default function ViewPage() {
  const currentImage = useGameStore(s => s.currentImage);

  if (!currentImage) {
    return <div className="p-8 text-center text-gray-500">Brak wybranego obrazka</div>;
  }

  const filename = currentImage.split("/").pop();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="mb-4 text-2xl">Aktualny obrazek:</h1>
      <div className="relative w-[80vw] h-[60vh] mb-4">
        <Image
          src={currentImage}
          alt={filename || ""}
          fill
          className="object-contain rounded-lg border"
          priority
        />
      </div>
      <p className="text-lg">{filename}</p>
    </div>
  );
}
