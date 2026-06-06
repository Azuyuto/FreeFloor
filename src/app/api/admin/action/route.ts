import { NextResponse } from "next/server";
import { getSyncSnapshot, queueAdminAction, type AdminAction } from "@/lib/serverSync";

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action as AdminAction;

  if (action !== "correct" && action !== "wrong") {
    return NextResponse.json({ error: "Nieprawidłowa akcja" }, { status: 400 });
  }

  queueAdminAction(action);
  return NextResponse.json(getSyncSnapshot());
}
