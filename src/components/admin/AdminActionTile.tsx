"use client";

import type { LucideIcon } from "lucide-react";

type AdminActionTileProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  colorClass?: string;
};

export default function AdminActionTile({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
  colorClass = "bg-muted hover:bg-muted/80",
}: AdminActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-colors disabled:opacity-50 ${colorClass}`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span className="text-center text-[10px] font-medium leading-tight">{loading ? "..." : label}</span>
    </button>
  );
}
