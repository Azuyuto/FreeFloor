// src/app/api/avatars/route.ts
import { NextResponse } from "next/server";
import { loadAvatars } from "@/lib/fileUtils";

export async function GET() {
  const avatars = await loadAvatars();
  return NextResponse.json(avatars);
}