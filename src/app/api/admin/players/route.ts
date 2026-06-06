import { NextResponse } from "next/server";
import { loadPlayersFromDisk, savePlayersToDisk } from "@/lib/playersPersistence";
import { touchPlayersUpdated } from "@/lib/serverSync";
import type { Player } from "@/lib/types";

export async function GET() {
  const players = await loadPlayersFromDisk();
  return NextResponse.json(players);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const players = body.players as Record<string, Player>;
    await savePlayersToDisk(players);
    touchPlayersUpdated();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd zapisu graczy";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
