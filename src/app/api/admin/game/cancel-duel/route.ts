import { NextResponse } from "next/server";
import { getSyncSnapshot, requestCancelDuel } from "@/lib/serverSync";

export async function POST() {
  requestCancelDuel();
  return NextResponse.json(getSyncSnapshot());
}
