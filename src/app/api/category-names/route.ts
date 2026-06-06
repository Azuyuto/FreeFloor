// src/app/api/category-names/route.ts
import { NextResponse } from "next/server";
import { loadCategoryNames } from "@/lib/fileUtils";

export async function GET() {
  const categories = await loadCategoryNames();
  return NextResponse.json(categories);
}