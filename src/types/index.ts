export type Rarity = 'C' | 'UC' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export type CardCategory =
  | 'People'
  | 'World Leaders'
  | 'Scientists'
  | 'Artists & Musicians'
  | 'Athletes'
  | 'Authors & Writers'
  | 'Countries'
  | 'Cities'
  | 'Landmarks'
  | 'Geography'
  | 'Animals'
  | 'Plants'
  | 'Food & Drink'
  | 'Science'
  | 'Technology'
  | 'Space & Astronomy'
  | 'Mathematics'
  | 'Medicine'
  | 'History'
  | 'Wars & Battles'
  | 'Philosophy & Religion'
  | 'Sports'
  | 'Movies & TV'
  | 'Music'
  | 'Literature'
  | 'Art'
  | 'Architecture'
  | 'Language'
  | 'Nature'
  | 'Weather & Climate'
  | 'Inventions'
  | 'Games & Hobbies'
  | 'Mythology'
  | 'General';

export interface WikiCard {
  id: string;
  title: string;
  extract: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  rarity: Rarity;
  category: CardCategory;
  atk: number;
  def: number;
  pageviews: number;
  articleLength: number;
  languages: number;
  wikiUrl: string;
  wikiRank: number | null;
  dailyViews: number | null;
  pageviewDate: string | null;
  pulledAt: string;
  isNew: boolean;
  duplicateCount: number;
}

export interface Pack {
  id: string;
  cards: WikiCard[];
  openedAt: string;
  packType: 'standard' | 'gold';
}

export interface Collection {
  cards: WikiCard[];
  totalPulls: number;
  packsOpened: number;
  stardust: number;
}

export interface GachaState {
  dailyPacks: number;
  maxPacks: number;
  lastRegenTime: string;
  pullsSinceGold: number;
  pityCounter: number;
}

export interface RarityConfig {
  name: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  weight: number;
  minPopScore: number;
  imageSize: 'none' | 'small' | 'medium' | 'large' | 'full';
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  C: {
    name: 'Common',
    color: 'text-gray-400',
    bgGradient: 'from-gray-800 to-gray-900',
    borderColor: 'border-gray-600',
    glowColor: 'shadow-gray-500/20',
    weight: 60,
    minPopScore: 0,
    imageSize: 'none',
  },
  UC: {
    name: 'Uncommon',
    color: 'text-slate-300',
    bgGradient: 'from-slate-700 to-slate-800',
    borderColor: 'border-slate-400',
    glowColor: 'shadow-slate-400/30',
    weight: 28,
    minPopScore: 10,
    imageSize: 'small',
  },
  R: {
    name: 'Rare',
    color: 'text-green-400',
    bgGradient: 'from-green-900 to-green-950',
    borderColor: 'border-green-500',
    glowColor: 'shadow-green-500/40',
    weight: 8,
    minPopScore: 25,
    imageSize: 'medium',
  },
  SR: {
    name: 'Super Rare',
    color: 'text-purple-400',
    bgGradient: 'from-purple-900 to-purple-950',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50',
    weight: 3,
    minPopScore: 50,
    imageSize: 'large',
  },
  SSR: {
    name: 'Super Special Rare',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-900/80 to-amber-950',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/60',
    weight: 0.8,
    minPopScore: 75,
    imageSize: 'large',
  },
  UR: {
    name: 'Ultra Rare',
    color: 'text-red-400',
    bgGradient: 'from-red-900/80 to-red-950',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/60',
    weight: 0.15,
    minPopScore: 90,
    imageSize: 'full',
  },
  LR: {
    name: 'Legend Rare',
    color: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400',
    bgGradient: 'from-indigo-900/80 via-purple-900/80 to-pink-900/80',
    borderColor: 'border-transparent',
    glowColor: 'shadow-purple-500/70',
    weight: 0.05,
    minPopScore: 97,
    imageSize: 'full',
  },
};

export const RARITY_ORDER: Rarity[] = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'LR'];

export interface Binder {
  id: string;
  name: string;
  description: string;
  icon: string;
  cardIds: string[];
  createdAt: string;
}

export interface BinderEntry {
  title: string;
  displayName?: string;
}

export interface BinderDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  entries: BinderEntry[];
}
