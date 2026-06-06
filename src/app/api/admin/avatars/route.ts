import { NextResponse } from "next/server";
import { addAvatar, deleteAvatar, loadAvatars } from "@/lib/fileUtils";
import { toPublicAvatarUrl } from "@/lib/mediaPaths";

export async function GET() {
  const avatars = await loadAvatars();
  return NextResponse.json(avatars);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = await addAvatar(file.name, buffer);
    return NextResponse.json({ filename, url: toPublicAvatarUrl(filename) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd dodawania avatara";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const filename = (body.filename as string).replace(/^\/avatars\//, "");
    await deleteAvatar(filename);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd usuwania avatara";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
