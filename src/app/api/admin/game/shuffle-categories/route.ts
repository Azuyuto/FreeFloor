import { NextResponse } from "next/server";
import { shuffleCategoriesForPlayers } from "@/lib/gameAdminService";
import { touchPlayersUpdated } from "@/lib/serverSync";

export async function POST() {
  try {
    await shuffleCategoriesForPlayers();
    touchPlayersUpdated();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd mieszania kategorii";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
