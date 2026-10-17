/**
 * Short-TTL Cache for Public Anonymous Feed Queries per §7.2
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export async function setCached<T>(key: string, data: T, ttlSeconds: number = 30): Promise<void> {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Prune if map exceeds 1000 items
  if (memoryCache.size > 1000) {
    const now = Date.now();
    memoryCache.forEach((v, k) => {
      if (now > v.expiresAt) memoryCache.delete(k);
    });
  }
}

export async function invalidateCachePrefix(prefix: string): Promise<void> {
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }
}
