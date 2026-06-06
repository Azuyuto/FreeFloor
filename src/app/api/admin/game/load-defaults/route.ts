import { NextResponse } from "next/server";
import { loadDefaultPlayers } from "@/lib/gameAdminService";
import { touchPlayersUpdated } from "@/lib/serverSync";

export async function POST() {
  try {
    await loadDefaultPlayers();
    touchPlayersUpdated();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd ładowania graczy";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
