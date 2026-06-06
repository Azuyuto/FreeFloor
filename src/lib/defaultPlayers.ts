// src/lib/defaultPlayers.ts
import type { Player } from "./types";
import { getPastelColorByIndex } from "./playerColors";

const getNicknameFromAvatarPath = (avatarUrl: string) => {
  const fileName = decodeURIComponent(avatarUrl.split("/").pop() || "");
  return fileName.replace(/\.[^.]+$/, "");
};

export const buildDefaultPlayersFromAvatars = (avatarUrls: string[]): Record<string, Player> => {
  return avatarUrls.reduce<Record<string, Player>>((acc, avatarUrl, index) => {
    const id = `p${index + 1}`;

    acc[id] = {
      id,
      nickname: getNicknameFromAvatarPath(avatarUrl),
      avatarUrl,
      color: getPastelColorByIndex(index),
      territory: [],
      category: "",
      timeLeft: 45_000,
      lockedUntil: 0,
    };

    return acc;
  }, {});
};
