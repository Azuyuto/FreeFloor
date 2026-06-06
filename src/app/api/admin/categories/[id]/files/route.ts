import { NextResponse } from "next/server";
import {
  addCategoryFile,
  deleteCategoryFile,
  renameCategoryFile,
} from "@/lib/fileUtils";
import { toPublicMediaUrl } from "@/lib/mediaPaths";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = await addCategoryFile(id, file.name, buffer);
    return NextResponse.json({ filename, url: toPublicMediaUrl(id, filename) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd dodawania pliku";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    const body = await request.json();
    const filename = await renameCategoryFile(id, body.oldFilename, body.newFilename);
    return NextResponse.json({ filename, url: toPublicMediaUrl(id, filename) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd zmiany nazwy pliku";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    const body = await request.json();
    await deleteCategoryFile(id, body.filename);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd usuwania pliku";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
