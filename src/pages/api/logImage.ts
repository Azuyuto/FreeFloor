// src/pages/api/logImage.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  let { imageName } = req.body as { imageName: string };
  // Usuń rozszerzenie (wszystko po ostatniej kropce)
  imageName = imageName.replace(/\.[^.]+$/, "");

  // Kolor zielony: ANSI escape code \x1b[32m … \x1b[0m przywraca domyślny
  console.log("\x1b[32m%s\x1b[0m", `Odpowiedź: ${imageName}`);

  res.status(200).json({ ok: true });
}
