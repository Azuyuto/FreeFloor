"use client";

import { useState } from "react";
import AdminControls from "@/components/admin/AdminControls";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminPlayers from "@/components/admin/AdminPlayers";

type AdminTab = "controls" | "categories" | "players";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "controls", label: "Sterowanie" },
  { id: "categories", label: "Kategorie" },
  { id: "players", label: "Gracze" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("controls");

  return (
    <main className="flex h-dvh w-full justify-center overflow-hidden bg-background p-2 sm:p-3">
      <div
        className={`flex h-full w-full flex-col overflow-hidden ${
          activeTab === "controls"
            ? "max-w-2xl"
            : activeTab === "categories"
              ? "max-w-[min(100%,90rem)]"
              : "max-w-4xl"
        }`}
      >
        <header className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-base font-semibold">Admin — Free Floor</h1>
          <nav className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeTab === "controls" && (
            <div className="h-full overflow-y-auto pr-1">
              <AdminControls />
            </div>
          )}
          {activeTab === "categories" && <AdminCategories />}
          {activeTab === "players" && (
            <div className="h-full overflow-y-auto">
              <AdminPlayers />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
