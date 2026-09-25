// Fast storage cache to eliminate synchronous localStorage main-thread blocking during mount
const storageCache: Record<string, string | null> = {};

export const getCachedStorage = (key: string): string | null => {
  if (key in storageCache) return storageCache[key];
  try {
    const val = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    storageCache[key] = val;
    return val;
  } catch {
    return null;
  }
};

export const setCachedStorage = (key: string, value: string): void => {
  storageCache[key] = value;
  if (typeof window === 'undefined') return;
  const save = () => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to save key "${key}":`, e);
    }
  };
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(save);
  } else {
    setTimeout(save, 16);
  }
};
