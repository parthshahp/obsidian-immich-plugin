const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

export class TTLCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private ttlMs: number;

	constructor(ttlMs: number = DEFAULT_TTL_MS) {
		this.ttlMs = ttlMs;
	}

	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) {
			return undefined;
		}
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}
		return entry.value;
	}

	set(key: string, value: T): void {
		this.cache.set(key, {
			value,
			expiresAt: Date.now() + this.ttlMs,
		});
	}

	has(key: string): boolean {
		return this.get(key) !== undefined;
	}

	clear(): void {
		this.cache.clear();
	}

	get size(): number {
		return this.cache.size;
	}
}

export const searchCache = new TTLCache<unknown[]>();
export const thumbnailCache = new TTLCache<Blob>();
