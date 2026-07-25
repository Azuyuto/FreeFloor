/**
 * Muzyka rundy: fetch → blob URL → Audio.
 * HTMLAudioElement.src=http URL wieszał się (networkState=2); blob + cache działa.
 */

type PlayingListener = (playing: boolean) => void;

let audio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;
let objectUrl: string | null = null;
let playSeq = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let fetchAbort: AbortController | null = null;
const listeners = new Set<PlayingListener>();
const blobCache = new Map<string, Blob>();
const blobInflight = new Map<string, Promise<Blob>>();

function notify(playing: boolean) {
  for (const listener of listeners) listener(playing);
}

function toFetchUrl(url: string): string {
  if (url.startsWith("/api/media/")) {
    return url.slice("/api/media".length);
  }
  return url;
}

async function loadBlob(fetchUrl: string): Promise<Blob> {
  const cached = blobCache.get(fetchUrl);
  if (cached) return cached;

  const inflight = blobInflight.get(fetchUrl);
  if (inflight) return inflight;

  const promise = (async () => {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    blobCache.set(fetchUrl, blob);
    blobInflight.delete(fetchUrl);
    return blob;
  })().catch(err => {
    blobInflight.delete(fetchUrl);
    throw err;
  });

  blobInflight.set(fetchUrl, promise);
  return promise;
}

function tearDownElement() {
  if (audio) {
    audio.onplaying = null;
    audio.onpause = null;
    audio.onended = null;
    audio.onerror = null;
    try {
      audio.pause();
    } catch {
      // ignore
    }
    audio.removeAttribute("src");
    audio = null;
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

function bindAudioEvents(el: HTMLAudioElement) {
  el.onplaying = () => notify(true);
  el.onpause = () => notify(false);
  el.onended = () => notify(false);
  el.onerror = () => notify(false);
}

async function playNow(url: string): Promise<void> {
  const fetchUrl = toFetchUrl(url);

  if (
    activeUrl === fetchUrl &&
    audio &&
    !audio.paused &&
    audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    notify(true);
    return;
  }

  const seq = ++playSeq;

  try {
    const blob = await loadBlob(fetchUrl);
    if (seq !== playSeq) return;

    tearDownElement();
    activeUrl = fetchUrl;
    objectUrl = URL.createObjectURL(blob);
    audio = new Audio(objectUrl);
    audio.loop = true;
    audio.muted = false;
    audio.volume = 1;
    bindAudioEvents(audio);

    await audio.play();
    if (seq !== playSeq) return;
    notify(true);
  } catch (err) {
    if (seq !== playSeq) return;
    console.error("[duel-music] play failed", err);
    notify(false);
  }
}

export function subscribeDuelMusic(listener: PlayingListener): () => void {
  listeners.add(listener);
  listener(!!audio && !audio.paused);
  return () => {
    listeners.delete(listener);
  };
}

export function preloadDuelMusic(url: string) {
  if (typeof window === "undefined" || !url) return;
  void loadBlob(toFetchUrl(url)).catch(() => {});
}

export function preloadDuelMusicMany(urls: string[]) {
  for (const url of urls) {
    preloadDuelMusic(url);
  }
}

export function playDuelMusic(url: string): void {
  if (typeof window === "undefined" || !url) return;
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void playNow(url);
  }, 30);
}

export function pauseDuelMusic() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  playSeq++;
  if (audio && !audio.paused) audio.pause();
  notify(false);
}

export function stopDuelMusic() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  playSeq++;
  if (fetchAbort) {
    fetchAbort.abort();
    fetchAbort = null;
  }
  activeUrl = null;
  tearDownElement();
  notify(false);
}

export function resumeDuelMusicIfNeeded() {
  // Celowo puste — resume na geście kolidował ze zmianą utworu.
}

export function clearDuelMusicCache() {
  blobCache.clear();
  blobInflight.clear();
}
