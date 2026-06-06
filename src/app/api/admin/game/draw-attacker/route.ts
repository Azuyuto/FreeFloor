import { NextResponse } from "next/server";
import { getSyncSnapshot, requestDrawAttacker } from "@/lib/serverSync";

export async function POST() {
  requestDrawAttacker();
  return NextResponse.json(getSyncSnapshot());
}
