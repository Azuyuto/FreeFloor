export const PASTEL_PLAYER_COLORS = [
  "#FADADD", "#D6EAF8", "#D5F5E3", "#FCF3CF", "#E8DAEF",
  "#FDEBD0", "#D4EFDF", "#F9E79F", "#D6DBDF", "#F5CBA7",
  "#AED6F1", "#A9DFBF", "#F5B7B1", "#D7BDE2", "#A3E4D7",
  "#F8C471", "#85C1E9", "#82E0AA", "#F1948A", "#BB8FCE",
  "#76D7C4", "#F0B27A", "#5DADE2", "#58D68D", "#EC7063",
  "#AF7AC5", "#48C9B0", "#EB984E", "#3498DB", "#2ECC71",
  "#E74C3C", "#9B59B6", "#1ABC9C", "#E67E22", "#2980B9",
  "#27AE60", "#C0392B", "#8E44AD", "#16A085", "#D35400",
] as const;

export const getPastelColorByIndex = (index: number) => {
  const safeIndex = Math.abs(index) % PASTEL_PLAYER_COLORS.length;
  return PASTEL_PLAYER_COLORS[safeIndex];
};

export const getPastelColorFromId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return getPastelColorByIndex(hash);
};
