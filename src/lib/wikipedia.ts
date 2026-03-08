import { WikiCard, Rarity, CardCategory } from '@/types';
import { calculateATK, calculateDEF } from './rarity';

const WIKI_API_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_ACTION_API = 'https://en.wikipedia.org/w/api.php';

interface WikiSummary {
  pageid: number;
  title: string;
  extract: string;
  description?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  content_urls: { desktop: { page: string } };
  lang: string;
  length?: number;
}

async function fetchRandomArticle(): Promise<WikiSummary | null> {
  try {
    const res = await fetch(`${WIKI_API_BASE}/page/random/summary`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchArticleSummary(title: string): Promise<WikiSummary | null> {
  try {
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(`${WIKI_API_BASE}/page/summary/${encodedTitle}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchArticleMeta(title: string): Promise<{ length: number; languages: number }> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'info|langlinks',
      llprop: 'url',
      lllimit: '500',
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`${WIKI_ACTION_API}?${params}`);
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return { length: 0, languages: 0 };
    const page = Object.values(pages)[0] as { length?: number; langlinks?: unknown[] };
    return {
      length: page.length || 0,
      languages: (page.langlinks || []).length,
    };
  } catch {
    return { length: 0, languages: 0 };
  }
}

function estimatePageviews(rarity: Rarity): number {
  const ranges: Record<Rarity, [number, number]> = {
    LR: [50000000, 100000000],
    UR: [10000000, 50000000],
    SSR: [2000000, 10000000],
    SR: [500000, 2000000],
    R: [100000, 500000],
    UC: [10000, 100000],
    C: [100, 10000],
  };
  const [min, max] = ranges[rarity];
  return Math.floor(min + Math.random() * (max - min));
}

export async function generateCard(rarity: Rarity): Promise<WikiCard | null> {
  const summary = await fetchRandomArticle();
  if (!summary) return null;

  const meta = await fetchArticleMeta(summary.title);
  const estimatedPageviews = estimatePageviews(rarity);

  const card: WikiCard = {
    id: `${summary.pageid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: summary.title,
    extract: summary.extract || summary.description || 'No description available.',
    imageUrl: summary.originalimage?.source || summary.thumbnail?.source || null,
    thumbnailUrl: summary.thumbnail?.source || null,
    rarity,
    category: 'General' as CardCategory,
    atk: calculateATK(estimatedPageviews, rarity),
    def: calculateDEF(meta.length || summary.extract?.length || 100, rarity),
    pageviews: estimatedPageviews,
    articleLength: meta.length,
    languages: meta.languages,
    wikiUrl: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
    pulledAt: new Date().toISOString(),
    isNew: true,
    duplicateCount: 0,
  };

  return card;
}

export async function generatePack(rarities: Rarity[]): Promise<WikiCard[]> {
  const cards = await Promise.all(rarities.map(r => generateCard(r)));
  return cards.filter((c): c is WikiCard => c !== null);
}
