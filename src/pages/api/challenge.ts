// pages/api/challenge.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { engines } from "@/lib/engineStore"; // teraz istnieje!

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { gameId, attackerId, defenderId } = req.body;

  const engine = engines.get(gameId);
  if (!engine) {
    return res.status(400).json({ error: "Game not found" });
  }

  try {
    engine.startDuel(attackerId, defenderId);
    res.status(200).json(engine.snapshot);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Something went wrong";
    res.status(400).json({ error: errorMessage });
  }
}