// src/components/WinnerOverlay.tsx
"use client";

import React, { useEffect } from "react";
import { useGameContext } from "@/components/GameProvider";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";

interface WinnerOverlayProps {
  winnerId: string;
  duration?: number; // optional, default 5 seconds
  onFinish?: () => void;
}

export default function WinnerOverlay({
  winnerId,
  duration = 5000,
  onFinish,
}: WinnerOverlayProps) {
  const { state } = useGameContext();
  const winner = state.players[winnerId];

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  if (!winner) return null;

  return (
    <div
      aria-label="WinnerOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none"
    >
      <div className="bg-blue-800 text-white text-6xl font-bold p-8 rounded-lg shadow-lg flex flex-col items-center">
        <span className="mb-4">ZWYCIĘZCA</span>
        <Avatar className="w-50 h-50 border-4 border-white shadow-2xl">
          <AvatarImage src={winner.avatarUrl} alt={winner.nickname} />
        </Avatar>
        <span className="mt-4">{winner.nickname}</span>
      </div>
    </div>
  );
}