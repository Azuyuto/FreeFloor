const SOUND_FILES = ["good.mp3", "bad.mp3"] as const;

type SoundFile = (typeof SOUND_FILES)[number];

let unlocked = false;
const sfxCache = new Map<SoundFile, string>();

async function ensureSfxBlob(file: SoundFile): Promise<string> {
  const cached = sfxCache.get(file);
  if (cached) return cached;
  const res = await fetch(`/sounds/${file}`);
  if (!res.ok) throw new Error(`SFX HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  sfxCache.set(file, url);
  return url;
}

export function preloadGameSounds() {
  if (typeof window === "undefined") return;
  for (const file of SOUND_FILES) {
    void ensureSfxBlob(file).catch(() => {});
  }
}

export function unlockGameSounds() {
  if (typeof window === "undefined") return;
  unlocked = true;

  void (async () => {
    try {
      const url = await ensureSfxBlob("good.mp3");
      const audio = new Audio(url);
      audio.volume = 0.001;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
    } catch {
      unlocked = false;
    }
  })();
}

export function playGameSound(file: SoundFile) {
  if (typeof window === "undefined") return;

  void (async () => {
    try {
      const url = await ensureSfxBlob(file);
      const audio = new Audio(url);
      audio.volume = 1;
      await audio.play();
    } catch (err) {
      console.error("[sfx] play failed", file, err);
      unlocked = false;
    }
  })();
}
