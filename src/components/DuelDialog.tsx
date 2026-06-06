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
import { formatDisplayLabel, getImageNameFromPath } from "@/lib/imageUtils";
import { shuffleArray } from "@/lib/shuffleArray";

export default function DuelDialog() {
  const { state, dispatch } = useGameContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const currentImage = useGameStore(s => s.currentImage);
  const setCurrentImage = useGameStore(s => s.setCurrentImage);;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrcRef = useRef<string | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  type AnswerOpts = { fromAdmin?: boolean };
  const onCorrectRef = useRef<(opts?: AnswerOpts) => void>(() => {});
  const onWrongRef = useRef<(opts?: AnswerOpts) => void>(() => {});
  const onCloseRef = useRef<() => void>(() => {});
  const answeringRef = useRef(false);
  const duelSessionRef = useRef<string | null>(null);
  const mediaRevisionRef = useRef(0);
  const syncQueueRef = useRef(Promise.resolve());
  const hadDuelRef = useRef(false);
  const categoriesRevisionRef = useRef(0);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [showResult, setShowResult] = useState<{ type: "correct" | "wrong"; message: string } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const duelDefenderId = state.duel?.defenderId ?? null;
  const duelDefenderCategory = duelDefenderId ? state.players[duelDefenderId]?.category ?? "" : "";

  const isMusicCategory = (name: string) => name.trim().startsWith("_");

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
  };

  const playSound = (file: string) => {
    const audio = new window.Audio(`/sounds/${file}`);
    audio.currentTime = 0;
    audio.play();
    // Automatyczne wstrzymanie po 0.5s (jeśli efekt długi)
    setTimeout(() => audio.pause(), 500);
  };

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

  const getDuelImageQueue = () => state.duel?.imageQueue ?? [];

  const getNextImagePath = () => {
    if (!state.duel) return null;
    const queue = getDuelImageQueue();
    const nextIdx = state.duel.imageIndex + 1;
    if (nextIdx >= queue.length) return null;
    return queue[nextIdx];
  };

  const syncToServer = (
    image: string | null,
    nextImage: string | null,
    duelActive: boolean
  ) => {
    const attacker = state.duel ? state.players[state.duel.attackerId] : null;
    const defender = state.duel ? state.players[state.duel.defenderId] : null;
    const currentTurn = state.duel ? state.players[state.duel.currentTurn] : null;
    const revision = ++mediaRevisionRef.current;

    syncQueueRef.current = syncQueueRef.current.then(async () => {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaRevision: revision,
          currentImage: image,
          nextImage,
          duelInfo: duelActive && attacker && defender && currentTurn && state.duel
            ? {
                attackerNickname: attacker.nickname,
                defenderNickname: defender.nickname,
                category: defender.category,
                status: state.status,
                currentTurnNickname: currentTurn.nickname,
                imageIndex: state.duel.imageIndex,
                imageQueue: state.duel.imageQueue,
              }
            : null,
        }),
      });
    });
  };

  useEffect(() => {
    registerAdminActionHandlers({
      onCorrect: () => onCorrectRef.current({ fromAdmin: true }),
      onWrong: () => onWrongRef.current({ fromAdmin: true }),
    });
    return () => clearAdminActionHandlers();
  }, []);

  useEffect(() => {
    if (!state.duel) {
      void syncToServer(null, null, false);
      return;
    }
    void syncToServer(currentImage, getNextImagePath(), true);
  }, [
    currentImage,
    state.duel?.attackerId,
    state.duel?.defenderId,
    state.duel?.currentTurn,
    state.duel?.imageIndex,
    state.duel?.imageQueue,
    state.status,
    categories,
  ]);

    useEffect(() => {
    if (!currentImage) return;
      const filename = currentImage.split("/").pop()!;
      fetch("/api/logImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageName: filename }),
      });
    }, [currentImage]);

  useEffect(() => {
    if (!duelDefenderId || !currentImage || state.status !== "duel") {
      resetAudio();
      return;
    }

    if (!isMusicCategory(duelDefenderCategory)) {
      resetAudio();
      return;
    }

    // Nie restartuj co tick: twórz nowy dźwięk tylko gdy zmienił się plik.
    if (audioRef.current && audioSrcRef.current === currentImage) {
      if (audioRef.current.paused) {
        void audioRef.current.play().catch(() => setIsAudioPlaying(false));
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(currentImage);
    audio.loop = true;
    audioRef.current = audio;
    audioSrcRef.current = currentImage;
    audio.onplay = () => setIsAudioPlaying(true);
    audio.onpause = () => setIsAudioPlaying(false);
    audio.onended = () => setIsAudioPlaying(false);
    void audio.play().catch(() => setIsAudioPlaying(false));

    return () => {
      // cleanup tylko przy faktycznej zmianie źródła/duelu
      if (audioRef.current !== audio) return;
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
      audioSrcRef.current = null;
      setIsAudioPlaying(false);
    };
  }, [currentImage, state.status, duelDefenderId, duelDefenderCategory]);

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
      setButtonsDisabled(false);
      setShowResult(null);
    }
  }, [duelSessionId, setCurrentImage]);

  // gdy status zmieni się na "ended", pokaż overlay zwycięzcy
  useEffect(() => {
    if (state.status === "finished" && state.lastWinner) {
      setShowWinner(true);
      // po 5 sekundach ukryj
      const t = setTimeout(() => setShowWinner(false), 5_000);
      return () => clearTimeout(t);
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

  const endLoading = () =>
  {
    dispatch(g => {
      g.endLoading();
    });
  }

  // Przy starcie pojedynku losuj kolejność zdjęć z kategorii broniącego
  useEffect(() => {
    if (!state.duel || categories.length === 0) return;
    if (state.duel.imageQueue.length > 0) return;

    const defender = state.players[state.duel.defenderId];
    const category = categories.find(c => c.id === defender.category);
    if (!category || category.images.length === 0) {
      setCurrentImage(null);
      return;
    }

    const shuffled = shuffleArray(category.images);
    dispatch(g => g.setDuelImageQueue(shuffled));
  }, [
    state.duel?.attackerId,
    state.duel?.defenderId,
    state.duel?.imageQueue.length,
    categories,
    dispatch,
    setCurrentImage,
    state.players,
  ]);

  // Wybierz bieżące zdjęcie z kolejki pojedynku
  useEffect(() => {
    if (!state.duel) return;

    const queue = state.duel.imageQueue;
    if (queue.length === 0) return;

    const idx = state.duel.imageIndex;
    if (idx >= queue.length) {
      dispatch(g => {
        g.endDuel();
      });
      return;
    }
    setCurrentImage(queue[idx]);
  }, [
    state.duel?.imageIndex,
    state.duel?.imageQueue,
    dispatch,
    setCurrentImage,
    state.duel,
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
    playSound("good.mp3");
    dispatch(g => {
      g.lockTick();
    });
    clearPendingAnswerTimeout();
    answerTimeoutRef.current = window.setTimeout(() => {
      dispatch(g => {
        if (!g.snapshot.duel) return;
        g.answerCorrect(turnPlayer.id);
      });
      answerTimeoutRef.current = null;
      answeringRef.current = false;
      setShowResult(null);
      setButtonsDisabled(false);
    }, 2000);
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
    playSound("bad.mp3");

    clearPendingAnswerTimeout();
    answerTimeoutRef.current = window.setTimeout(() => {
      dispatch(g => {
        if (!g.snapshot.duel) return;
        g.answerWrong(turnPlayer.id);
      });
      answerTimeoutRef.current = null;
      answeringRef.current = false;
      setShowResult(null);
      setButtonsDisabled(false);
    }, 3000);
  };

  onCorrectRef.current = onCorrect;
  onWrongRef.current = onWrong;

  const onClose = () => {
    dispatch(g => g.cancelDuel());
    void fetch("/api/admin/game/cancel-duel", { method: "POST" });
  };

  onCloseRef.current = onClose;

  if(showWinner && state.lastWinner)
  {
    return (
      <WinnerOverlay
        winnerId={state.lastWinner!}
        duration={5000}
        onFinish={() => {
          setShowWinner(false);
        }}
      />
    )
  }

  if (!state.duel) return null;

  const attacker = state.players[state.duel?.attackerId];
  const defender = state.players[state.duel.defenderId];
  const currentTurnPlayer = state.players[state.duel.currentTurn];
  const isMusicDuel = isMusicCategory(defender.category);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="fixed min-w-full max-w-full text-white max-h-full w-screen h-screen p-0 gap-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        {/* Header z przyciskiem zamknięcia */}
        <DialogHeader className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center justify-between rounded-lg px-6 py-3">
            <DialogTitle className="text-2xl text-white ">
              Kategoria: {formatDisplayLabel(defender.category)}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Główny layout — niebieskie tło gry, przy odpowiedzi przejście w zielony / czerwony */}
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
          
          {/* Lewa kolumna - Atakujący */}
          <div className="col-span-1 flex flex-col items-center justify-center p-8 relative">
            <div className="absolute top-8 text-white text-sm font-medium">
              ATAKUJĄCY
            </div>
            
            {/* Avatar atakującego */}
            <div className="mb-8">
              <div className={`relative ${currentTurnPlayer.id === attacker.id ? 'ring-4 ring-yellow-400 rounded-full ring-pulse' : ''}`}>
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

            {/* Nazwa i dane atakującego */}
            <div className="text-center text-white mb-8">
              <ChessTimer playerId={attacker.id} />
            </div>
          </div>

          {/* Środkowa kolumna - Zdjęcie i przyciski */}
          <div className="col-span-4 flex flex-col items-center justify-center p-8 relative">
            
            {/* Media (obraz lub dźwięk) */}
            <div className="flex-1 w-full flex items-center justify-center">
            {currentImage && !isMusicDuel && (
              <div className="flex-1 w-full flex items-center justify-center h-[70vh]">
                <div className="relative w-full h-full max-w-6xl max-h-[70vh]">
                  <Image
                    src={currentImage}
                    alt="Pytanie do zgadnięcia"
                    fill
                    className="object-contain rounded-xl"
                    priority
                  />
                </div>
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

            {/* Przyciski akcji */}
            {/* <div className="w-full max-w-2xl flex space-x-6">
              <Button 
                className="flex-1 font-bold bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all" 
                onClick={onCorrect}
                disabled={buttonsDisabled}
              >
                ✓ POPRAWNA
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 font-bold bg-red-600 hover:bg-red-700 shadow-lg transform hover:scale-105 transition-all" 
                onClick={onWrong}
                disabled={buttonsDisabled}
              >
                ✗ PAS
              </Button>
            </div> */}

            {/* Informacje o medium */}
            {state.status == "loading" && <CountdownOverlay onFinish={endLoading}/>}
            <div className="mt-4 text-center text-white/70 text-sm">
              {isMusicDuel ? "Dźwięk" : "Obraz"} {(state.duel?.imageIndex || 0) + 1} | Kategoria: {formatDisplayLabel(defender.category)}
            </div>
          </div>

          {/* Prawa kolumna - Broniący */}
          <div className="col-span-1 flex flex-col items-center justify-center p-8 relative">
            <div className="absolute top-8 text-white text-sm font-medium">
              BRONIĄCY
            </div>
            
            {/* Avatar broniącego */}
            <div className="mb-8">
              <div className={`relative ${currentTurnPlayer.id === defender.id ? 'ring-4 ring-yellow-400 rounded-full ring-pulse' : ''}`}>
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

            {/* Nazwa i dane broniącego */}
            <div className="text-center text-white mb-8">
              <ChessTimer playerId={defender.id} />
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
