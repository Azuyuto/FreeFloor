import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPublicDir } from "@/lib/publicPaths";

type RouteContext = { params: Promise<{ path: string[] }> };

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { path: segments } = await context.params;
    if (!segments?.length) {
      return NextResponse.json({ error: "Brak ścieżki" }, { status: 400 });
    }

    const publicDir = getPublicDir();
    const decoded = segments.map(s => decodeURIComponent(s));
    const filePath = path.join(publicDir, ...decoded);

    const resolvedPublic = path.resolve(publicDir);
    const resolvedFile = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedPublic)) {
      return NextResponse.json({ error: "Niedozwolona ścieżka" }, { status: 403 });
    }

    const buffer = await fs.readFile(resolvedFile);
    const ext = path.extname(resolvedFile).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Plik nie znaleziony" }, { status: 404 });
  }
}
