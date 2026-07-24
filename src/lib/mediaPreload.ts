const imageCache = new Map<string, HTMLImageElement>();
const textCache = new Map<string, string>();

const TOTAL_PRELOAD_TIMEOUT_MS = 8000;

export const isTextPath = (path: string | null | undefined) =>
  !!path && /\.txt$/i.test(path);

export function getCachedText(url: string): string | null {
  return textCache.get(url) ?? null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([
    promise,
    new Promise<void>(resolve => {
      window.setTimeout(resolve, ms);
    }),
  ]);
}

function preloadImage(url: string): Promise<void> {
  const cached = imageCache.get(url);
  if (cached?.complete) return Promise.resolve();

  return new Promise(resolve => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      imageCache.set(url, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

async function preloadText(url: string): Promise<void> {
  if (textCache.has(url)) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const text = (await res.text()).trim();
    textCache.set(url, text);
  } catch {
    // ignore preload errors
  }
}

/** Preload tylko obrazów i tekstu. Muzyka / audio — nigdy. */
export async function preloadMediaUrls(urls: string[]): Promise<void> {
  const toPreload = urls.filter(url => !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(url));
  await withTimeout(
    Promise.all(
      toPreload.map(url => {
        if (isTextPath(url)) return preloadText(url);
        return preloadImage(url);
      })
    ),
    TOTAL_PRELOAD_TIMEOUT_MS
  );
}

export function clearMediaCaches() {
  imageCache.clear();
  textCache.clear();
}
