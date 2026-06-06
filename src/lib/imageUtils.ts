export const isMusicCategory = (name: string) => name.trim().startsWith("_");

export function formatDisplayLabel(text: string): string {
  if (!text) return "";
  try {
    return decodeURIComponent(text).replace(/_/g, " ");
  } catch {
    return text.replace(/_/g, " ");
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
