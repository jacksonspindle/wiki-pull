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
