"use client";

import type { Player } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type AttackerDrawModalProps = {
  open: boolean;
  player: Player | null;
  isDrawing: boolean;
};

export default function AttackerDrawModal({ open, player, isDrawing }: AttackerDrawModalProps) {
  if (!player) return null;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="flex max-w-lg flex-col items-center gap-6 border-2 py-10 text-center sm:max-w-xl"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {isDrawing ? "Losowanie atakującego..." : "Wylosowano atakującego!"}
        </p>

        <div
          className={`relative transition-transform duration-150 ${
            isDrawing ? "scale-105 animate-pulse" : "scale-100"
          }`}
        >
          <img
            src={player.avatarUrl}
            alt={player.nickname}
            className={`h-48 w-48 rounded-full border-8 object-cover shadow-2xl sm:h-56 sm:w-56 ${
              isDrawing ? "border-amber-400" : "border-green-500"
            }`}
          />
        </div>

        <div className="space-y-1">
          <h2
            className={`text-4xl font-bold sm:text-5xl ${
              isDrawing ? "text-amber-600" : "text-green-600"
            }`}
          >
            {player.nickname}
          </h2>
          <p className="text-lg text-muted-foreground">{player.category}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
