import { NextResponse } from "next/server";
import { shuffleBoardForPlayers } from "@/lib/gameAdminService";
import { touchPlayersUpdated } from "@/lib/serverSync";

export async function POST() {
  try {
    await shuffleBoardForPlayers();
    touchPlayersUpdated();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd mieszania planszy";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
