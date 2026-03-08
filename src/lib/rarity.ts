import { Rarity, RARITY_CONFIG, RARITY_ORDER } from '@/types';

/** Pure random rarity roll — no pity, no mercy */
export function rollRarity(): Rarity {
  const totalWeight = RARITY_ORDER.reduce((sum, r) => sum + RARITY_CONFIG[r].weight, 0);
  let random = Math.random() * totalWeight;

  for (const rarity of RARITY_ORDER) {
    random -= RARITY_CONFIG[rarity].weight;
    if (random <= 0) return rarity;
  }

  return 'C';
}

export function getPopularityTierRange(rarity: Rarity): { start: number; end: number } {
  switch (rarity) {
    case 'LR': return { start: 0, end: 10 };
    case 'UR': return { start: 10, end: 50 };
    case 'SSR': return { start: 50, end: 200 };
    case 'SR': return { start: 200, end: 1000 };
    case 'R': return { start: 1000, end: 5000 };
    case 'UC': return { start: 5000, end: 20000 };
    case 'C': return { start: 20000, end: 100000 };
  }
}

export function calculateATK(pageviews: number, rarity: Rarity): number {
  const rarityMultiplier: Record<Rarity, number> = {
    C: 0.5, UC: 0.7, R: 1.0, SR: 1.3, SSR: 1.6, UR: 2.0, LR: 2.5,
  };
  const base = Math.log10(Math.max(pageviews, 1)) * 1000;
  const atk = Math.round(base * rarityMultiplier[rarity]);
  return Math.min(15000, Math.max(100, atk));
}

export function calculateDEF(articleLength: number, rarity: Rarity): number {
  const rarityMultiplier: Record<Rarity, number> = {
    C: 0.5, UC: 0.7, R: 1.0, SR: 1.3, SSR: 1.6, UR: 2.0, LR: 2.5,
  };
  const base = Math.log10(Math.max(articleLength, 1)) * 1200;
  const def = Math.round(base * rarityMultiplier[rarity]);
  return Math.min(15000, Math.max(100, def));
}

export function calculateRegenPacks(lastRegenTime: string, currentPacks: number, maxPacks: number): number {
  const elapsed = Date.now() - new Date(lastRegenTime).getTime();
  const minutesElapsed = Math.floor(elapsed / 60000);
  const regenPacks = Math.min(minutesElapsed, maxPacks - currentPacks);
  return Math.max(0, regenPacks);
}

export function getStardustValue(rarity: Rarity): number {
  const values: Record<Rarity, number> = {
    C: 5, UC: 15, R: 50, SR: 150, SSR: 500, UR: 1500, LR: 5000,
  };
  return values[rarity];
}
