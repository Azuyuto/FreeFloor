"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Music, Pencil, Plus, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";
import { getImageNameFromPath } from "@/lib/imageUtils";
import { isMusicCategory } from "@/lib/imageUtils";

const isAudioPath = (path: string) => /\.(mp3|wav|ogg|m4a)$/i.test(path);

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCategory = categories.find(c => c.id === selectedId) ?? null;

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    const data: Category[] = await res.json();
    setCategories(data);
    if (selectedId && !data.find(c => c.id === selectedId)) {
      setSelectedId(null);
    } else if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
      setRenameCategoryName(data[0].id);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newCategoryName }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd tworzenia kategorii");
        return;
      }
      const created = await res.json();
      setNewCategoryName("");
      await fetchCategories();
      setSelectedId(created.id);
      setRenameCategoryName(created.id);
    } finally {
      setLoading(false);
    }
  };

  const renameCategory = async () => {
    if (!selectedId || !renameCategoryName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(selectedId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newId: renameCategoryName }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd zmiany nazwy");
        return;
      }
      const data = await res.json();
      setSelectedId(data.id);
      setRenameCategoryName(data.id);
      await fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(`Usunąć kategorię "${id}" wraz ze wszystkimi plikami?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (selectedId === id) setSelectedId(null);
      await fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!selectedId) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(selectedId)}/files`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd uploadu");
        return;
      }
      await fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  const renameFile = async (oldFilename: string) => {
    if (!selectedId || !newFileName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(selectedId)}/files`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldFilename, newFilename: newFileName }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd zmiany nazwy pliku");
        return;
      }
      setEditingFile(null);
      setNewFileName("");
      await fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  const shuffleCategoryImages = async () => {
    if (!selectedId) return;
    if (selectedCategory && selectedCategory.images.length < 2) {
      alert("Kategoria musi mieć co najmniej 2 pliki do wymieszania.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(selectedId)}/shuffle`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd mieszania plików");
        return;
      }
      await fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (filename: string) => {
    if (!selectedId) return;
    if (!confirm(`Usunąć plik "${filename}"?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/categories/${encodeURIComponent(selectedId)}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      await fetchCategories();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 gap-0 overflow-hidden rounded-lg border">
      {/* Sidebar — 1/4 */}
      <aside className="flex w-1/4 min-w-[11rem] flex-col border-r bg-card">
        <div className="shrink-0 space-y-3 border-b p-3">
          <h2 className="text-sm font-semibold">Kategorie</h2>
          <div className="flex gap-1">
            <Input
              placeholder="Nowa kategoria"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={e => e.key === "Enter" && createCategory()}
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={createCategory} disabled={loading}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Prefiks <code>_</code> = kategoria muzyczna
          </p>
        </div>

        <div className="flex items-center justify-between shrink-0 px-3 py-2 border-b">
          <span className="text-xs text-muted-foreground">{categories.length} kategorii</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">Brak kategorii</p>
          ) : (
            categories.map(cat => (
              <div
                key={cat.id}
                className={`group flex cursor-pointer items-center justify-between border-b px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 ${
                  selectedId === cat.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                }`}
                onClick={() => {
                  setSelectedId(cat.id);
                  setRenameCategoryName(cat.id);
                  setEditingFile(null);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{cat.id}</div>
                  <div className="text-[10px] text-muted-foreground">{cat.images.length} plików</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={e => {
                    e.stopPropagation();
                    deleteCategory(cat.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main — 3/4 */}
      <div className="flex w-3/4 flex-col overflow-hidden bg-background">
        {selectedCategory ? (
          <>
            <div className="shrink-0 space-y-3 border-b p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold truncate">{selectedCategory.id}</h2>
                {isMusicCategory(selectedCategory.id) && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    Muzyka
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={renameCategoryName}
                  onChange={e => setRenameCategoryName(e.target.value)}
                  className="max-w-xs h-9"
                  placeholder="Nazwa folderu"
                />
                <Button size="sm" onClick={renameCategory} disabled={loading}>
                  Zmień nazwę
                </Button>
                <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                  <Plus className="h-4 w-4" />
                  Dodaj plik
                  <input
                    type="file"
                    accept="image/*,audio/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file);
                      e.target.value = "";
                    }}
                  />
                </Label>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={shuffleCategoryImages}
                  disabled={loading || (selectedCategory?.images.length ?? 0) < 2}
                >
                  <Shuffle className="mr-1.5 h-4 w-4" />
                  Wymieszaj zdjęcia
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedCategory.images.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak plików w tej kategorii.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {selectedCategory.images.map(url => {
                    const filename = url.split("/").pop() ?? url;
                    const displayName = getImageNameFromPath(url);
                    const isEditing = editingFile === filename;
                    const isAudio = isAudioPath(url);

                    return (
                      <div
                        key={url}
                        className="group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm"
                      >
                        <div className="relative aspect-square w-full bg-muted">
                          {isAudio ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                              <Music className="h-10 w-10" />
                              <span className="text-[10px] px-2 text-center line-clamp-2">
                                {displayName}
                              </span>
                            </div>
                          ) : (
                            <Image
                              src={url}
                              alt={displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )}
                          <div className="absolute inset-0 flex items-end justify-center gap-1 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingFile(filename);
                                setNewFileName(displayName);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() => deleteFile(filename)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          {isEditing ? (
                            <div className="space-y-1">
                              <Input
                                value={newFileName}
                                onChange={e => setNewFileName(e.target.value)}
                                className="h-7 text-xs"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === "Enter") renameFile(filename);
                                  if (e.key === "Escape") {
                                    setEditingFile(null);
                                    setNewFileName("");
                                  }
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-6 flex-1 text-xs"
                                  onClick={() => renameFile(filename)}
                                  disabled={loading}
                                >
                                  OK
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => {
                                    setEditingFile(null);
                                    setNewFileName("");
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="truncate text-xs font-medium" title={displayName}>
                              {displayName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Wybierz kategorię z listy po lewej
          </div>
        )}
      </div>
    </div>
  );
}
