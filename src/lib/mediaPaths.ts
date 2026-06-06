export function toPublicMediaUrl(categoryId: string, filename: string): string {
  const encodedCategory = encodeURIComponent(categoryId);
  const encodedFile = encodeURIComponent(filename);
  return `/api/media/categories/${encodedCategory}/${encodedFile}`;
}

export function toPublicAvatarUrl(filename: string): string {
  return `/api/media/avatars/${encodeURIComponent(filename)}`;
}
