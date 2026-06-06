import { NextResponse } from "next/server";
import { deleteCategory, renameCategory } from "@/lib/fileUtils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    const body = await request.json();
    const newId = await renameCategory(id, body.newId ?? body.name ?? "");
    return NextResponse.json({ id: newId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd zmiany nazwy kategorii";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId);
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd usuwania kategorii";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
