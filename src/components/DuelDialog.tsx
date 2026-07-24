// src/components/DuelDialog.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useGameContext } from "@/components/GameProvider";
import { Category } from "@/lib/types";
import { ChessTimer } from "./ChessTimer";
import CountdownOverlay from "./CountdownOverlay";
import WinnerOverlay from "./WinnerOverlay";
import { useGameStore } from "@/stores/useGameStore";
import {
  clearAdminActionHandlers,
  registerAdminActionHandlers,
} from "@/lib/adminActionBridge";
import {
  formatDisplayLabel,
  getImageNameFromPath,
  isMusicCategory,
  isTextCategory,
} from "@/lib/imageUtils";
import { shuffleArray } from "@/lib/shuffleArray";
import { playGameSound, preloadGameSounds, unlockGameSounds } from "@/lib/gameSounds";
import {
  clearMediaCaches,
  getCachedText,
  isTextPath,
  preloadMediaUrls,
} from "@/lib/mediaPreload";
import { useGameConfigStore } from "@/stores/useGameConfigStore";

export default function DuelDialog() {
  const { state, dispatch } = useGameContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const currentImage = useGameStore(s => s.currentImage);
  const setCurrentImage = useGameStore(s => s.setCurrentImage);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrcRef = useRef<string | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  type AnswerOpts = { fromAdmin?: boolean };
  const onCorrectRef = useRef<(opts?: AnswerOpts) => void>(() => {});
  const onWrongRef = useRef<(opts?: AnswerOpts) => void>(() => {});
  const onCloseRef = useRef<() => void>(() => {});
  const answeringRef = useRef(false);
  const duelSessionRef = useRef<string | null>(null);
  const hadDuelRef = useRef(false);
  const categoriesRevisionRef = useRef(0);
  const mediaReadyRef = useRef(false);
  const pendingEndLoadingRef = useRef(false);
  const endedByQueueRef = useRef(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [showResult, setShowResult] = useState<{ type: "correct" | "wrong"; message: string } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const duelDefenderId = state.duel?.defenderId ?? null;
  const duelDefenderCategory = duelDefenderId ? state.players[duelDefenderId]?.category ?? "" : "";
  const duelImageIndex = state.duel?.imageIndex ?? 0;
  const duelImageQueue = state.duel?.imageQueue;
  const duelQueueLength = duelImageQueue?.length ?? 0;

  const clearPendingAnswerTimeout = () => {
    if (answerTimeoutRef.current !== null) {
      window.clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
    audioRef.current = null;
    audioSrcRef.current = null;
    setIsAudioPlaying(false);
  };

  const resetLocalDuelUi = () => {
    answeringRef.current = false;
    setButtonsDisabled(false);
    setShowResult(null);
    setShowWinner(false);
    setTextContent(null);
    setMediaReady(false);
    mediaReadyRef.current = false;
    pendingEndLoadingRef.current = false;
    endedByQueueRef.current = false;
    clearMediaCaches();
  };

  const tryEndLoading = () => {
    if (mediaReadyRef.current) {
      pendingEndLoadingRef.current = false;
      queueMicrotask(() => {
        dispatch(g => g.endLoading());
      });
      return;
    }
    pendingEndLoadingRef.current = true;
  };

  useEffect(() => {
    preloadGameSounds();
    const unlock = () => unlockGameSounds();
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (state.duel) {
      hadDuelRef.current = true;
      return;
    }
    if (!hadDuelRef.current) return;
    hadDuelRef.current = false;
    clearPendingAnswerTimeout();
    resetAudio();
    resetLocalDuelUi();
    setCurrentImage(null);
  }, [state.duel, setCurrentImage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        if (buttonsDisabled || !state.duel) return;
        onWrongRef.current();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        if (buttonsDisabled || !state.duel) return;
        onCorrectRef.current();
      } else if (e.code === "Escape" && state.duel) {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [buttonsDisabled, state.duel]);

  useEffect(() => {
    registerAdminActionHandlers({
      onCorrect: () => onCorrectRef.current({ fromAdmin: true }),
      onWrong: () => onWrongRef.current({ fromAdmin: true }),
    });
    return () => clearAdminActionHandlers();
  }, []);

  useEffect(() => {
    if (!currentImage) return;
    const filename = currentImage.split("/").pop()!;
    fetch("/api/logImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageName: filename }),
    });
  }, [currentImage]);

  // Muzyka kategorii _ — jak w oryginale, ale bez niszczenia elementu przy zmianie utworu
  useEffect(() => {
    if (!duelDefenderId || !currentImage || state.status !== "duel") {
      resetAudio();
      return;
    }

    if (!isMusicCategory(duelDefenderCategory)) {
      resetAudio();
      return;
    }

    // Ten sam utwór — tylko wznów, jeśli pauza
    if (audioRef.current && audioSrcRef.current === currentImage) {
      if (audioRef.current.paused) {
        void audioRef.current.play().catch(() => setIsAudioPlaying(false));
      }
      return;
    }

    const attachHandlers = (audio: HTMLAudioElement) => {
      audio.loop = true;
      audio.onplay = () => setIsAudioPlaying(true);
      audio.onpause = () => setIsAudioPlaying(false);
      audio.onended = () => setIsAudioPlaying(false);
    };

    if (audioRef.current) {
      // Ten sam element = przeglądarka pozwala na kolejne play()
      const audio = audioRef.current;
      attachHandlers(audio);
      audioSrcRef.current = currentImage;
      audio.src = currentImage;
      void audio.play().catch(() => setIsAudioPlaying(false));
      return;
    }

    const audio = new Audio(currentImage);
    attachHandlers(audio);
    audioRef.current = audio;
    audioSrcRef.current = currentImage;
    void audio.play().catch(() => setIsAudioPlaying(false));
  }, [currentImage, state.status, duelDefenderId, duelDefenderCategory]);

  useEffect(() => {
    if (!currentImage || !isTextPath(currentImage)) {
      setTextContent(null);
      return;
    }
    const cached = getCachedText(currentImage);
    if (cached !== null) {
      setTextContent(cached);
      return;
    }
    let cancelled = false;
    void fetch(currentImage)
      .then(res => res.text())
      .then(text => {
        if (!cancelled) setTextContent(text.trim());
      })
      .catch(() => {
        if (!cancelled) setTextContent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentImage]);

  const duelSessionId = state.duel
    ? `${state.duel.attackerId}-${state.duel.defenderId}`
    : null;

  useEffect(() => {
    if (!duelSessionId) {
      if (duelSessionRef.current !== null) {
        clearPendingAnswerTimeout();
        resetAudio();
        resetLocalDuelUi();
        setCurrentImage(null);
      }
      duelSessionRef.current = null;
      return;
    }

    if (duelSessionRef.current !== duelSessionId) {
      duelSessionRef.current = duelSessionId;
      answeringRef.current = false;
      endedByQueueRef.current = false;
      setButtonsDisabled(false);
      setShowResult(null);
      setMediaReady(false);
      mediaReadyRef.current = false;
      pendingEndLoadingRef.current = false;
    }
  }, [duelSessionId, setCurrentImage]);

  useEffect(() => {
    if (state.status === "finished" && state.lastWinner) {
      setShowWinner(true);
    }
  }, [state.status, state.lastWinner]);

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    const data: Category[] = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    void loadCategories();

    const watchCategoryChanges = async () => {
      try {
        const res = await fetch("/api/sync");
        if (!res.ok) return;
        const data = await res.json();
        const revision = data.categoriesRevision ?? 0;
        if (categoriesRevisionRef.current === 0) {
          categoriesRevisionRef.current = revision;
          return;
        }
        if (revision > categoriesRevisionRef.current) {
          categoriesRevisionRef.current = revision;
          await loadCategories();
        }
      } catch {
        // ignore polling errors
      }
    };

    const intervalId = window.setInterval(watchCategoryChanges, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Przy starcie pojedynku losuj kolejność mediów z kategorii broniącego
  useEffect(() => {
    if (!state.duel || categories.length === 0) return;
    if (duelQueueLength > 0) return;

    const defender = state.players[state.duel.defenderId];
    if (!defender) return;
    const category = categories.find(c => c.id === defender.category);
    if (!category || category.images.length === 0) {
      setCurrentImage(null);
      // Pusta kategoria — odblokuj start rundy
      mediaReadyRef.current = true;
      setMediaReady(true);
      if (pendingEndLoadingRef.current) {
        pendingEndLoadingRef.current = false;
        queueMicrotask(() => dispatch(g => g.endLoading()));
      }
      return;
    }

    const shuffled = shuffleArray(category.images);
    dispatch(g => g.setDuelImageQueue(shuffled));
  }, [
    state.duel?.attackerId,
    state.duel?.defenderId,
    duelQueueLength,
    categories,
    dispatch,
    setCurrentImage,
    state.players,
  ]);

  // Preload obrazów/tekstu podczas ładowania — muzyka bez preloadu
  useEffect(() => {
    if (!state.duel || state.status !== "loading") return;
    if (duelQueueLength === 0) return;

    const defender = state.players[state.duel.defenderId];
    if (defender && isMusicCategory(defender.category)) {
      mediaReadyRef.current = true;
      setMediaReady(true);
      if (pendingEndLoadingRef.current) {
        pendingEndLoadingRef.current = false;
        queueMicrotask(() => dispatch(g => g.endLoading()));
      }
      return;
    }

    let cancelled = false;
    mediaReadyRef.current = false;
    setMediaReady(false);

    void preloadMediaUrls(state.duel.imageQueue).then(() => {
      if (cancelled) return;
      mediaReadyRef.current = true;
      setMediaReady(true);
      if (pendingEndLoadingRef.current) {
        pendingEndLoadingRef.current = false;
        queueMicrotask(() => {
          dispatch(g => g.endLoading());
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    state.duel?.attackerId,
    state.duel?.defenderId,
    duelQueueLength,
    state.status,
    state.players,
    dispatch,
  ]);

  // Wybierz bieżące medium z kolejki (bez zależności od całego obiektu duel — unikaj re-run co tick)
  useEffect(() => {
    if (!duelSessionId || duelQueueLength === 0 || !duelImageQueue) return;

    if (duelImageIndex >= duelQueueLength) {
      if (!endedByQueueRef.current) {
        endedByQueueRef.current = true;
        dispatch(g => g.endDuel());
      }
      return;
    }
    setCurrentImage(duelImageQueue[duelImageIndex]);
  }, [
    duelSessionId,
    duelImageIndex,
    duelImageQueue,
    duelQueueLength,
    dispatch,
    setCurrentImage,
  ]);

  const onCorrect = (opts?: AnswerOpts) => {
    if (!state.duel) return;
    if (answeringRef.current) return;
    if (buttonsDisabled && !opts?.fromAdmin) return;

    const turnPlayer = state.players[state.duel.currentTurn];
    if (!turnPlayer) return;

    const imageName = getImageNameFromPath(currentImage);
    if (!imageName || imageName === "Brak aktualnego zdjęcia") return;

    answeringRef.current = true;
    setShowResult({ type: "correct", message: imageName });
    setButtonsDisabled(true);
    playGameSound("good.mp3");
    dispatch(g => {
      g.lockTick();
    });
    clearPendingAnswerTimeout();
    const correctRevealMs = useGameConfigStore.getState().correctRevealMs;
    answerTimeoutRef.current = window.setTimeout(() => {
      dispatch(g => {
        if (!g.snapshot.duel) return;
        g.answerCorrect(turnPlayer.id);
      });
      answerTimeoutRef.current = null;
      answeringRef.current = false;
      setShowResult(null);
      setButtonsDisabled(false);
    }, correctRevealMs);
  };

  const onWrong = (opts?: AnswerOpts) => {
    if (!state.duel) return;
    if (answeringRef.current) return;
    if (buttonsDisabled && !opts?.fromAdmin) return;

    const turnPlayer = state.players[state.duel.currentTurn];
    if (!turnPlayer) return;

    const imageName = getImageNameFromPath(currentImage);
    if (!imageName || imageName === "Brak aktualnego zdjęcia") return;

    answeringRef.current = true;
    setShowResult({ type: "wrong", message: imageName });
    setButtonsDisabled(true);
    playGameSound("bad.mp3");
    // Pass: timer gracza dalej leci (bez lockTick)

    clearPendingAnswerTimeout();
    const passRevealMs = useGameConfigStore.getState().passRevealMs;
    answerTimeoutRef.current = window.setTimeout(() => {
      dispatch(g => {
        if (!g.snapshot.duel) return;
        g.answerWrong(turnPlayer.id);
      });
      answerTimeoutRef.current = null;
      answeringRef.current = false;
      setShowResult(null);
      setButtonsDisabled(false);
    }, passRevealMs);
  };

  onCorrectRef.current = onCorrect;
  onWrongRef.current = onWrong;

  const onClose = () => {
    dispatch(g => g.cancelDuel());
    void fetch("/api/admin/game/cancel-duel", { method: "POST" });
  };

  onCloseRef.current = onClose;

  if (showWinner && state.lastWinner) {
    return (
      <WinnerOverlay
        winnerId={state.lastWinner}
        duration={5000}
        onFinish={() => {
          setShowWinner(false);
          dispatch(g => {
            g.acknowledgeWinner();
            g.reloadFromStore(useGameConfigStore.getState().gridSize);
          });
        }}
      />
    );
  }

  if (!state.duel) return null;

  const attacker = state.players[state.duel.attackerId];
  const defender = state.players[state.duel.defenderId];
  if (!attacker || !defender) return null;

  const currentTurnPlayer = state.players[state.duel.currentTurn];
  if (!currentTurnPlayer) return null;

  const isMusicDuel = isMusicCategory(defender.category);
  const isTextDuel = isTextCategory(defender.category);
  const mediaLabel = isMusicDuel ? "Dźwięk" : isTextDuel ? "Tekst" : "Obraz";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="fixed min-w-full max-w-full text-white max-h-full w-screen h-screen p-0 gap-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        <DialogHeader className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center justify-between rounded-lg px-6 py-3">
            <DialogTitle className="text-2xl text-white ">
              Kategoria: {formatDisplayLabel(defender.category)}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="relative h-full">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-600 to-blue-900 transition-opacity duration-700 ease-in-out ${
              showResult ? "opacity-20" : "opacity-100"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-green-600/80 via-emerald-700/75 to-green-950/85 transition-opacity duration-700 ease-in-out ${
              showResult?.type === "correct" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-red-600/80 via-red-700/75 to-red-950/85 transition-opacity duration-700 ease-in-out ${
              showResult?.type === "wrong" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="relative z-10 grid h-full grid-cols-6 gap-0">
            <div className="col-span-1 flex flex-col items-center justify-center p-8 relative">
              <div className="absolute top-8 text-white text-sm font-medium">
                ATAKUJĄCY
              </div>

              <div className="mb-8">
                <div className={`relative ${currentTurnPlayer.id === attacker.id ? "ring-4 ring-yellow-400 rounded-full ring-pulse" : ""}`}>
                  <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                    <AvatarImage src={attacker.avatarUrl} alt={attacker.nickname} />
                  </Avatar>
                  {currentTurnPlayer.id === attacker.id && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                      TURA
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-white mb-8">
                <ChessTimer playerId={attacker.id} ticks={currentTurnPlayer.id === attacker.id} />
              </div>
            </div>

            <div className="col-span-4 flex flex-col items-center justify-center p-8 relative">
              <div className="flex-1 w-full flex items-center justify-center">
                {currentImage && !isMusicDuel && !isTextDuel && (
                  <div className="flex h-[70vh] w-full items-center justify-center px-4">
                    <div className="relative flex h-[65vh] w-full max-w-6xl items-center justify-center overflow-hidden rounded-xl bg-black/20 shadow-2xl">
                      <Image
                        key={currentImage}
                        src={currentImage}
                        alt="Pytanie do zgadnięcia"
                        fill
                        className="object-contain p-2"
                        priority
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {currentImage && isTextDuel && (
                  <div className="flex h-[70vh] w-full max-w-6xl items-center justify-center px-6">
                    <p className="text-center text-7xl font-extrabold leading-tight tracking-wide text-white drop-shadow-lg md:text-8xl">
                      {textContent ?? "…"}
                    </p>
                  </div>
                )}

                {currentImage && isMusicDuel && (
                  <div className="flex h-[70vh] w-full max-w-6xl items-center justify-center">
                    <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-black/25 p-8 backdrop-blur-sm">
                      <div className="mb-6 text-center text-white/90">
                        Odtwarzany dźwięk
                      </div>
                      <div className="flex h-40 items-end justify-center gap-2">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-3 rounded-full bg-cyan-300 ${isAudioPlaying ? "animate-pulse" : "opacity-50"}`}
                            style={{
                              height: `${28 + ((i * 13) % 70)}px`,
                              animationDelay: `${i * 70}ms`,
                              animationDuration: "650ms",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="z-20 mb-6 flex h-28 w-full max-w-5xl items-center justify-center px-6">
                <span
                  className={`text-center text-6xl font-bold leading-tight ${
                    showResult ? "text-white drop-shadow-lg" : "text-transparent select-none"
                  }`}
                  aria-hidden={!showResult}
                >
                  {showResult?.message ?? "."}
                </span>
              </div>

              {state.status === "loading" && (
                <CountdownOverlay
                  onFinish={tryEndLoading}
                  subtitle={mediaReady ? undefined : "Wczytywanie mediów…"}
                />
              )}
              <div className="mt-4 text-center text-white/70 text-sm">
                {mediaLabel} {(state.duel?.imageIndex || 0) + 1} | Kategoria:{" "}
                {formatDisplayLabel(defender.category)}
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center p-8 relative">
              <div className="absolute top-8 text-white text-sm font-medium">
                BRONIĄCY
              </div>

              <div className="mb-8">
                <div className={`relative ${currentTurnPlayer.id === defender.id ? "ring-4 ring-yellow-400 rounded-full ring-pulse" : ""}`}>
                  <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                    <AvatarImage src={defender.avatarUrl} alt={defender.nickname} />
                  </Avatar>
                  {currentTurnPlayer.id === defender.id && (
                    <div className="absolute -top-2 -left-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                      TURA
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-white mb-8">
                <ChessTimer playerId={defender.id} ticks={currentTurnPlayer.id === defender.id} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
