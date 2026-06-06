import { NextResponse } from "next/server";
import { loadGameConfig, saveGameConfig } from "@/lib/gameConfig";
import { setGridSize, touchConfigUpdated } from "@/lib/serverSync";

export async function GET() {
  const config = await loadGameConfig();
  setGridSize(config.gridSize);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const config = await saveGameConfig({ gridSize: body.gridSize });
    setGridSize(config.gridSize);
    touchConfigUpdated();
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd zapisu konfiguracji";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
