import { NextApiRequest, NextApiResponse } from "next";
import { loadCategories } from "@/lib/fileUtils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cats = await loadCategories();
  res.status(200).json(cats);
}