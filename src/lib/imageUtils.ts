export const isMusicCategory = (name: string) => name.trim().startsWith("_");
export const isTextCategory = (name: string) => name.trim().startsWith("-");

export const isAudioPath = (path: string | null | undefined) =>
  !!path && /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(path);

export function formatDisplayLabel(text: string): string {
  if (!text) return "";
  try {
    const decoded = decodeURIComponent(text).replace(/_/g, " ");
    return decoded.replace(/^[-_]+/, "").trim() || decoded;
  } catch {
    return text.replace(/_/g, " ").replace(/^[-_]+/, "").trim() || text;
  }
}

export function getImageNameFromPath(imagePath: string | null): string {
  if (!imagePath) return "Brak aktualnego zdjęcia";
  const filename = imagePath.split("/").pop() ?? imagePath;
  const decodedFilename = formatDisplayLabel(filename);
  const extensionIndex = decodedFilename.lastIndexOf(".");
  if (extensionIndex <= 0) return decodedFilename;
  return decodedFilename.slice(0, extensionIndex);
}
