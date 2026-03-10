import { WikiCard, Collection, GachaState, Binder } from '@/types';
import { getStardustValue } from './rarity';
import { supabase } from './supabase';

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

// --- Helpers ---

async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// --- Snake/camel case mapping ---

function cardToRow(card: WikiCard, userId: string) {
  return {
    id: card.id,
    user_id: userId,
    title: card.title,
    extract: card.extract,
    image_url: card.imageUrl,
    thumbnail_url: card.thumbnailUrl,
    rarity: card.rarity,
    category: card.category,
    atk: card.atk,
    def: card.def,
    pageviews: card.pageviews,
    article_length: card.articleLength,
    languages: card.languages,
    wiki_url: card.wikiUrl,
    wiki_rank: card.wikiRank,
    daily_views: card.dailyViews,
    pageview_date: card.pageviewDate,
    pulled_at: card.pulledAt,
    is_new: card.isNew,
    duplicate_count: card.duplicateCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCard(row: any): WikiCard {
  return {
    id: row.id,
    title: row.title,
    extract: row.extract,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    rarity: row.rarity,
    category: row.category,
    atk: row.atk,
    def: row.def,
    pageviews: row.pageviews,
    articleLength: row.article_length,
    languages: row.languages,
    wikiUrl: row.wiki_url,
    wikiRank: row.wiki_rank,
    dailyViews: row.daily_views,
    pageviewDate: row.pageview_date,
    pulledAt: row.pulled_at,
    isNew: row.is_new,
    duplicateCount: row.duplicate_count,
  };
}

// --- Supabase sync (fire-and-forget) ---

function syncCollectionStats(collection: Collection): void {
  const db = supabase;
  if (!db) return;
  getUserId().then(userId => {
    if (!userId) return;
    db.from('game_state').update({
      total_pulls: collection.totalPulls,
      packs_opened: collection.packsOpened,
      stardust: collection.stardust,
    }).eq('user_id', userId).then(({ error }) => {
      if (error) console.warn('Supabase stats sync failed:', error.message);
    });
  });
}

function syncGachaFields(state: GachaState): void {
  const db = supabase;
  if (!db) return;
  getUserId().then(userId => {
    if (!userId) return;
    db.from('game_state').update({
      daily_packs: state.dailyPacks,
      max_packs: state.maxPacks,
      last_regen_time: state.lastRegenTime,
      pulls_since_gold: state.pullsSinceGold,
      pity_counter: state.pityCounter,
    }).eq('user_id', userId).then(({ error }) => {
      if (error) console.warn('Supabase gacha sync failed:', error.message);
    });
  });
}

// --- Load from Supabase on mount ---

export async function loadCollectionFromServer(): Promise<Collection> {
  if (!supabase) return getCollection();

  try {
    const userId = await getUserId();
    if (!userId) return getCollection();

    // Ensure game_state row exists for this user
    await supabase.from('game_state').upsert({ user_id: userId }, { onConflict: 'user_id' });

    const [cardsRes, stateRes] = await Promise.all([
      supabase.from('cards').select('*'),
      supabase.from('game_state').select('*').eq('user_id', userId).single(),
    ]);

    if (cardsRes.error || stateRes.error) {
      console.warn('Supabase load failed, falling back to localStorage');
      return getCollection();
    }

    const collection: Collection = {
      cards: (cardsRes.data || []).map(rowToCard),
      totalPulls: stateRes.data.total_pulls,
      packsOpened: stateRes.data.packs_opened,
      stardust: stateRes.data.stardust,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
    }
    return collection;
  } catch {
    return getCollection();
  }
}

export async function loadGachaStateFromServer(): Promise<GachaState> {
  if (!supabase) return getGachaState();

  try {
    const userId = await getUserId();
    if (!userId) return getGachaState();

    // Ensure game_state row exists
    await supabase.from('game_state').upsert({ user_id: userId }, { onConflict: 'user_id' });

    const { data, error } = await supabase
      .from('game_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return getGachaState();

    const state: GachaState = {
      dailyPacks: data.daily_packs,
      maxPacks: data.max_packs,
      lastRegenTime: data.last_regen_time,
      pullsSinceGold: data.pulls_since_gold,
      pityCounter: data.pity_counter,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(GACHA_STATE_KEY, JSON.stringify(state));
    }
    return state;
  } catch {
    return getGachaState();
  }
}

// --- Local storage (fast reads) ---

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
  syncCollectionStats(collection);
}

export function addCardsToCollection(newCards: WikiCard[]): Collection {
  const collection = getCollection();
  const newRowsForSupabase: WikiCard[] = [];
  const updatedDuplicates: { title: string; duplicateCount: number }[] = [];

  for (const card of newCards) {
    const existingIndex = collection.cards.findIndex(c => c.title === card.title);

    if (existingIndex >= 0) {
      collection.cards[existingIndex].duplicateCount += 1;
      card.isNew = false;
      card.duplicateCount = collection.cards[existingIndex].duplicateCount;
      updatedDuplicates.push({
        title: card.title,
        duplicateCount: collection.cards[existingIndex].duplicateCount,
      });
    } else {
      card.isNew = true;
      collection.cards.push({ ...card });
      newRowsForSupabase.push(card);
    }
  }

  collection.totalPulls += newCards.length;
  collection.packsOpened += 1;

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  }

  // Sync to Supabase (fire-and-forget)
  const db = supabase;
  if (db) {
    getUserId().then(userId => {
      if (!userId) return;

      if (newRowsForSupabase.length > 0) {
        db.from('cards')
          .insert(newRowsForSupabase.map(c => cardToRow(c, userId)))
          .then(({ error }) => {
            if (error) console.warn('Supabase card insert failed:', error.message);
          });
      }
      for (const dup of updatedDuplicates) {
        db.from('cards')
          .update({ duplicate_count: dup.duplicateCount })
          .eq('title', dup.title)
          .eq('user_id', userId)
          .then(({ error }) => {
            if (error) console.warn('Supabase duplicate update failed:', error.message);
          });
      }
    });
    syncCollectionStats(collection);
  }

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

    if (typeof window !== 'undefined') {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
    }

    // Sync to Supabase
    const db2 = supabase;
    if (db2) {
      getUserId().then(userId => {
        if (!userId) return;
        db2.from('cards')
          .update({ duplicate_count: card.duplicateCount })
          .eq('title', cardTitle)
          .eq('user_id', userId)
          .then(({ error }) => {
            if (error) console.warn('Supabase duplicate convert failed:', error.message);
          });
      });
      syncCollectionStats(collection);
    }
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
  syncGachaFields(state);
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

// --- Binder functions ---

export async function loadBinders(): Promise<Binder[]> {
  if (!supabase) return [];

  const userId = await getUserId();
  if (!userId) return [];

  const { data: binders, error } = await supabase
    .from('binders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !binders) return [];

  // Fetch all binder_cards for this user's binders
  const binderIds = binders.map(b => b.id);
  const { data: binderCards } = await supabase
    .from('binder_cards')
    .select('binder_id, card_id')
    .in('binder_id', binderIds.length > 0 ? binderIds : ['__none__']);

  const cardsByBinder = new Map<string, string[]>();
  for (const bc of binderCards || []) {
    const list = cardsByBinder.get(bc.binder_id) || [];
    list.push(bc.card_id);
    cardsByBinder.set(bc.binder_id, list);
  }

  return binders.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description || '',
    icon: b.icon || '',
    cardIds: cardsByBinder.get(b.id) || [],
    createdAt: b.created_at,
  }));
}

export async function createBinder(name: string, description: string, icon: string): Promise<Binder | null> {
  if (!supabase) return null;

  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('binders')
    .insert({ user_id: userId, name, description, icon })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    icon: data.icon || '',
    cardIds: [],
    createdAt: data.created_at,
  };
}

export async function deleteBinder(binderId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('binders').delete().eq('id', binderId);
}

export async function addCardToBinder(binderId: string, cardId: string): Promise<void> {
  if (!supabase) return;

  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('binder_cards').insert({
    binder_id: binderId,
    card_id: cardId,
    user_id: userId,
  });
}

export async function removeCardFromBinder(binderId: string, cardId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('binder_cards')
    .delete()
    .eq('binder_id', binderId)
    .eq('card_id', cardId);
}

// pity system removed — pure random
