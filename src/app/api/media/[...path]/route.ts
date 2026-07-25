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
  ".txt": "text/plain; charset=utf-8",
};

function parseRange(
  rangeHeader: string | null,
  fileSize: number
): { start: number; end: number } | null {
  if (!rangeHeader?.startsWith("bytes=")) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const hasStart = match[1] !== "";
  const hasEnd = match[2] !== "";
  if (!hasStart && !hasEnd) return null;

  let start = hasStart ? Number(match[1]) : 0;
  let end = hasEnd ? Number(match[2]) : fileSize - 1;

  // bytes=-N → ostatnie N bajtów
  if (!hasStart && hasEnd) {
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
    return null;
  }

  end = Math.min(end, fileSize - 1);
  if (start >= fileSize) return null;
  return { start, end };
}

export async function GET(request: Request, context: RouteContext) {
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
    const fileSize = buffer.byteLength;
    const range = parseRange(request.headers.get("range"), fileSize);

    // HTMLAudioElement wysyła Range — bez 206 + Content-Range Chrome często nie gra /api/media
    if (range) {
      const { start, end } = range;
      const chunk = Uint8Array.from(buffer.subarray(start, end + 1));
      return new NextResponse(chunk as unknown as BodyInit, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(chunk.byteLength),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const body = Uint8Array.from(buffer);
    return new NextResponse(body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Plik nie znaleziony" }, { status: 404 });
  }
}
