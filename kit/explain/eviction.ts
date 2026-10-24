// Pure eviction policies for SlotGrid (kept apart so they are easy to test).

export type Policy = 'lru' | 'lfu' | 'fifo';

/** One cache entry: seconds since last use, total hits, and insertion order (1 = oldest). */
export type Slot = {key: string; lastUsed: number; hits: number; order: number};

/** Index of the entry a policy evicts: LRU the least recently used, LFU the least used, FIFO the oldest insert. */
export const victimOf = (slots: Slot[], policy: Policy): number => {
  const score = (s: Slot) => (policy === 'lru' ? s.lastUsed : policy === 'lfu' ? -s.hits : -s.order);
  return slots.reduce((best, s, i) => (score(s) > score(slots[best]) ? i : best), 0);
};

/** The per-slot fact a policy looks at, as shown under each key. */
export const policyLabel = (s: Slot, policy: Policy) =>
  policy === 'lru' ? `${s.lastUsed} s ago` : policy === 'lfu' ? `${s.hits} hits` : `#${s.order} . ${s.hits} hits`;
