import { NextResponse } from "next/server";
import { createCategory, loadCategories } from "@/lib/fileUtils";

export async function GET() {
  const categories = await loadCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await createCategory(body.id ?? body.name ?? "");
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd tworzenia kategorii";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
