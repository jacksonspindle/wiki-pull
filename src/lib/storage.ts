import { WikiCard, Collection } from '@/types';
import { getStardustValue } from './rarity';

const COLLECTION_KEY = 'wikipull_collection';

const DEFAULT_COLLECTION: Collection = {
  cards: [],
  totalPulls: 0,
  packsOpened: 0,
  stardust: 0,
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
