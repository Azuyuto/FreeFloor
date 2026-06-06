import fs from "node:fs";
import path from "node:path";

export function getProjectRoot(): string {
  const cwd = process.cwd();
  const candidates = [
    cwd,
    path.join(cwd, ".."),
    path.join(cwd, "..", ".."),
  ];

  for (const candidate of candidates) {
    const pkg = path.join(candidate, "package.json");
    if (fs.existsSync(pkg)) return candidate;
  }

  return cwd;
}

export function getPublicDir(): string {
  const root = getProjectRoot();
  const direct = path.join(root, "public");
  if (fs.existsSync(direct)) return direct;

  const standalone = path.join(root, ".next", "standalone", "public");
  if (fs.existsSync(standalone)) return standalone;

  return direct;
}

export function getDataDir(): string {
  const root = getProjectRoot();
  const direct = path.join(root, "data");
  if (fs.existsSync(direct)) return direct;

  const standalone = path.join(root, ".next", "standalone", "data");
  if (fs.existsSync(path.dirname(standalone))) return standalone;

  return direct;
}
