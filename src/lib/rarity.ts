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
