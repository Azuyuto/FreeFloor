const SOUND_FILES = ["good.mp3", "bad.mp3"] as const;

type SoundFile = (typeof SOUND_FILES)[number];

const cache = new Map<SoundFile, HTMLAudioElement>();
let unlocked = false;

function getAudio(file: SoundFile): HTMLAudioElement {
  let audio = cache.get(file);
  if (!audio) {
    audio = new Audio(`/sounds/${file}`);
    audio.preload = "auto";
    cache.set(file, audio);
  }
  return audio;
}

export function preloadGameSounds() {
  for (const file of SOUND_FILES) {
    getAudio(file);
  }
}

export function unlockGameSounds() {
  if (unlocked || typeof window === "undefined") return;

  for (const file of SOUND_FILES) {
    const audio = getAudio(file);
    const prevVolume = audio.volume;
    audio.volume = 0.001;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = prevVolume;
        unlocked = true;
      })
      .catch(() => {
        audio.volume = prevVolume;
      });
  }
}

export function playGameSound(file: SoundFile) {
  if (typeof window === "undefined") return;
  const audio = getAudio(file);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    unlockGameSounds();
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  });
}
