import { NextResponse } from "next/server";
import { getSyncSnapshot, requestStartDuel } from "@/lib/serverSync";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const snapshot = getSyncSnapshot();

  const attackerId = (body.attackerId as string | undefined) ?? snapshot.selectedAttackerId;
  const defenderId = (body.defenderId as string | undefined) ?? snapshot.selectedDefenderId;

  if (!attackerId || !defenderId) {
    return NextResponse.json(
      { error: "Wybierz atakującego i obrońcę" },
      { status: 400 }
    );
  }

  if (attackerId === defenderId) {
    return NextResponse.json(
      { error: "Atakujący i obrońca muszą być różni" },
      { status: 400 }
    );
  }

  requestStartDuel(attackerId, defenderId);
  return NextResponse.json(getSyncSnapshot());
}
