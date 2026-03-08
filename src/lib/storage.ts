import { WikiCard, Collection, GachaState } from '@/types';
import { getStardustValue } from './rarity';

const COLLECTION_KEY = 'wikipull_collection';
const GACHA_STATE_KEY = 'wikipull_gacha_state';

// DEBUG: Set to true for unlimited packs during development
const DEBUG_UNLIMITED_PACKS = true;

const DEFAULT_COLLECTION: Collection = {
  cards: [],
  totalPulls: 0,
  packsOpened: 0,
  stardust: 0,
};

const DEFAULT_GACHA_STATE: GachaState = {
  dailyPacks: DEBUG_UNLIMITED_PACKS ? 9999 : 10,
  maxPacks: DEBUG_UNLIMITED_PACKS ? 9999 : 10,
  lastRegenTime: new Date().toISOString(),
  pullsSinceGold: 0,
  pityCounter: 0,
};

export function getCollection(): Collection {
  if (typeof window === 'undefined') return DEFAULT_COLLECTION;
  try {
    const data = localStorage.getItem(COLLECTION_KEY);
    if (!data) return DEFAULT_COLLECTION;
    return JSON.parse(data);
  } catch {
    return DEFAULT_COLLECTION;
  }
}

export function saveCollection(collection: Collection): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}

export function addCardsToCollection(newCards: WikiCard[]): Collection {
  const collection = getCollection();

  for (const card of newCards) {
    const existingIndex = collection.cards.findIndex(c => c.title === card.title);

    if (existingIndex >= 0) {
      collection.cards[existingIndex].duplicateCount += 1;
      card.isNew = false;
      card.duplicateCount = collection.cards[existingIndex].duplicateCount;
    } else {
      card.isNew = true;
      collection.cards.push({ ...card });
    }
  }

  collection.totalPulls += newCards.length;
  collection.packsOpened += 1;

  saveCollection(collection);
  return collection;
}

export function convertDuplicateToStardust(cardTitle: string): Collection {
  const collection = getCollection();
  const cardIndex = collection.cards.findIndex(c => c.title === cardTitle);

  if (cardIndex >= 0 && collection.cards[cardIndex].duplicateCount > 0) {
    const card = collection.cards[cardIndex];
    const stardust = getStardustValue(card.rarity);
    collection.stardust += stardust;
    card.duplicateCount -= 1;
    saveCollection(collection);
  }

  return collection;
}

export function getGachaState(): GachaState {
  if (typeof window === 'undefined') return DEFAULT_GACHA_STATE;
  try {
    const data = localStorage.getItem(GACHA_STATE_KEY);
    if (!data) return DEFAULT_GACHA_STATE;
    return JSON.parse(data);
  } catch {
    return DEFAULT_GACHA_STATE;
  }
}

export function saveGachaState(state: GachaState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GACHA_STATE_KEY, JSON.stringify(state));
}

export function consumePack(): GachaState {
  const state = getGachaState();
  if (state.dailyPacks <= 0) return state;

  if (!DEBUG_UNLIMITED_PACKS) {
    state.dailyPacks -= 1;
  }
  state.pullsSinceGold += 1;
  state.lastRegenTime = new Date().toISOString();

  saveGachaState(state);
  return state;
}

export function regeneratePacks(): GachaState {
  const state = getGachaState();
  const now = Date.now();
  const lastRegen = new Date(state.lastRegenTime).getTime();
  const minutesElapsed = Math.floor((now - lastRegen) / 60000);

  if (minutesElapsed > 0 && state.dailyPacks < state.maxPacks) {
    const newPacks = Math.min(minutesElapsed, state.maxPacks - state.dailyPacks);
    state.dailyPacks += newPacks;
    state.lastRegenTime = new Date().toISOString();
    saveGachaState(state);
  }

  return state;
}

export function isGoldPack(): boolean {
  const state = getGachaState();
  return state.pullsSinceGold >= 9;
}

export function resetGoldCounter(): void {
  const state = getGachaState();
  state.pullsSinceGold = 0;
  saveGachaState(state);
}

// pity system removed — pure random
