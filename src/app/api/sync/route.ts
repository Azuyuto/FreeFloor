import { NextResponse } from "next/server";
import {
  consumePendingAction,
  getSyncSnapshot,
  setCurrentImage,
  setDuelInfo,
  setNextImage,
  setSelectedCombatants,
  updateDuelMedia,
  type DuelSyncInfo,
} from "@/lib/serverSync";

export async function GET() {
  return NextResponse.json(getSyncSnapshot());
}

export async function POST(request: Request) {
  const body = await request.json();

  if (typeof body.mediaRevision === "number") {
    updateDuelMedia({
      mediaRevision: body.mediaRevision,
      currentImage: body.currentImage ?? null,
      nextImage: body.nextImage ?? null,
      duelInfo: "duelInfo" in body ? ((body.duelInfo as DuelSyncInfo | null) ?? null) : undefined,
    });
  } else {
    if ("currentImage" in body) {
      setCurrentImage(body.currentImage ?? null);
    }

    if ("nextImage" in body) {
      setNextImage(body.nextImage ?? null);
    }

    if ("duelInfo" in body) {
      setDuelInfo((body.duelInfo as DuelSyncInfo | null) ?? null);
    }
  }

  if ("selectedAttackerId" in body || "selectedDefenderId" in body) {
    const snapshot = getSyncSnapshot();
    setSelectedCombatants(
      "selectedAttackerId" in body ? (body.selectedAttackerId ?? null) : snapshot.selectedAttackerId,
      "selectedDefenderId" in body ? (body.selectedDefenderId ?? null) : snapshot.selectedDefenderId
    );
  }

  if (body.consumeAction === true) {
    if (body.duelActive === true) {
      const action = consumePendingAction();
      return NextResponse.json({ ...getSyncSnapshot(), consumedAction: action });
    }
    return NextResponse.json({ ...getSyncSnapshot(), consumedAction: null });
  }

  return NextResponse.json(getSyncSnapshot());
}
