import { NextResponse } from "next/server";
import { shuffleCategoryMedia } from "@/lib/fileUtils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    const images = await shuffleCategoryMedia(id);
    return NextResponse.json({ id, images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd mieszania plików kategorii";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
