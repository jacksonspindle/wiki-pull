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

// --- Dynamic article ranking via Wikimedia Pageviews API ---

export interface RankedArticle {
  title: string;
  views: number;
  rank: number;
}

// Rank ranges for each rarity tier (based on Wikipedia pageview rankings)
export const TIER_RANGES: Record<string, [number, number]> = {
  LR: [1, 10],
  UR: [11, 50],
  SSR: [51, 200],
  SR: [201, 500],
  R: [501, 1000],
};

let cachedArticles: RankedArticle[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/** Fetch the top ~1000 most-viewed Wikipedia articles from Wikimedia's Pageviews API */
export async function fetchTopArticles(): Promise<RankedArticle[]> {
  if (cachedArticles && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedArticles;
  }

  try {
    // Use 2 days ago to ensure data is available
    const date = new Date(Date.now() - 2 * 86400000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const res = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`,
      { headers: { 'Api-User-Agent': 'WikiPull/1.0 (https://github.com/jacksonspindle/wiki-pull)' } }
    );

    if (!res.ok) throw new Error(`Pageviews API ${res.status}`);

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawArticles: any[] = data.items?.[0]?.articles || [];

    // Filter out non-content pages, then re-rank
    let rank = 0;
    const ranked: RankedArticle[] = [];
    for (const a of rawArticles) {
      const title: string = a.article;
      if (
        title === 'Main_Page' ||
        title === 'Special:Search' ||
        title.startsWith('Special:') ||
        title.startsWith('Wikipedia:') ||
        title.startsWith('File:') ||
        title.startsWith('Portal:') ||
        title.startsWith('Help:') ||
        title.startsWith('Template:') ||
        title.startsWith('Category:') ||
        title === '-'
      ) continue;

      rank++;
      ranked.push({
        title: title.replace(/_/g, ' '),
        views: a.views,
        rank,
      });
    }

    cachedArticles = ranked;
    cacheTime = Date.now();
    return ranked;
  } catch {
    return cachedArticles || [];
  }
}

/** Get the articles that fall within a specific rarity tier's rank range */
export function getArticlesForTier(rarity: string, articles: RankedArticle[]): RankedArticle[] {
  const range = TIER_RANGES[rarity];
  if (!range) return [];
  const [start, end] = range;
  return articles.filter(a => a.rank >= start && a.rank <= end);
}

/** Pick a random article from a rarity tier using live pageview data */
async function pickArticleFromTier(rarity: Rarity): Promise<RankedArticle | null> {
  const topArticles = await fetchTopArticles();

  if (topArticles.length > 0) {
    const pool = getArticlesForTier(rarity, topArticles);
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return null;
}

// --- Category detection ---

function detectCategory(title: string, extract: string): CardCategory {
  const text = `${title} ${extract}`.toLowerCase();

  // Order matters — more specific categories first, then broader ones
  const patterns: [CardCategory, RegExp][] = [
    // Specific people categories
    ['Athletes', /\b(footballer|basketball player|tennis player|boxer|swimmer|sprinter|quarterback|pitcher|goalkeeper|olympi|medal|nba |nfl |fifa|mlb |premier league|world cup.*player|plays? for)\b/],
    ['World Leaders', /\b(president of|prime minister|chancellor|monarch|king of|queen of|emperor of|dictator|head of state|political leader|secretary.general)\b/],
    ['Scientists', /\b(physicist|chemist|biologist|mathematician|astronomer|geologist|neuroscientist|researcher|discovered|invention|nobel prize.*science|nobel prize.*physics|nobel prize.*chemistry)\b/],
    ['Artists & Musicians', /\b(painter|sculptor|composer|pianist|violinist|conductor|rapper|singer.songwriter|musical artist|hip.hop artist|rock band|pop singer|album.*released|discography)\b/],
    ['Authors & Writers', /\b(novelist|poet |playwright|author of|wrote the|literary|bestselling author|published.*novel|pulitzer|booker prize)\b/],

    // Food & Drink
    ['Food & Drink', /\b(dish |cuisine|food |recipe|ingredient|flavor|cooked|eaten|beverage|drink |coffee|tea |wine |beer |cocktail|dessert|bread|cheese|meat |fruit|vegetable|spice|sushi|pizza|pasta|curry|chocolate|delicacy|ferment)\b/],

    // Landmarks & Architecture
    ['Landmarks', /\b(landmark|monument|memorial|statue|tower |cathedral|basilica|mosque|temple|palace|castle|fortress|pyramid|colosseum|world heritage|built in|constructed in|historic site|tourist attraction)\b/],
    ['Architecture', /\b(architecture|architectural|building design|skyscraper|bridge |dam |structure.*designed|gothic.*style|baroque.*style|art deco|brutalis)\b/],

    // Space & Astronomy
    ['Space & Astronomy', /\b(planet|star |stellar|galaxy|nebula|constellation|asteroid|comet|orbit|spacecraft|astronaut|cosmonaut|nasa|space.*mission|light.year|solar system|milky way|telescope.*space|black hole|supernova)\b/],

    // Animals & Plants
    ['Animals', /\b(species of|genus of|family of|animal|mammal|bird |reptile|amphibian|fish |insect|arachnid|crustacean|predator|prey|endangered|habitat.*native|found in.*wild)\b/],
    ['Plants', /\b(plant |flower|tree |shrub|herb |grass|fern|moss|fungus|botanical|photosynthesis|seed|pollen|bloom|cultivar|genus.*plant)\b/],

    // Science subcategories
    ['Medicine', /\b(disease|syndrome|disorder|treatment|symptom|diagnos|surgery|pharmaceutical|drug |vaccine|therapy|pathology|clinical|patient|hospital|medical|cancer|infection)\b/],
    ['Mathematics', /\b(theorem|equation|formula|algebra|geometry|calculus|topology|mathematical|number theory|conjecture|proof |prime number|function.*math|integral|derivative|probability)\b/],
    ['Technology', /\b(software|hardware|computer|programming|algorithm|internet|website|app |digital|processor|semiconductor|artificial intelligence|machine learning|robot|startup|silicon valley|tech company)\b/],
    ['Science', /\b(scientific|physics|chemistry|biology|quantum|molecule|atom|element|particle|experiment|laboratory|electron|neutron|proton|genome|dna |rna |cell.*biology|chemical)\b/],

    // Geography & Places
    ['Countries', /\b(country|sovereign state|republic of|kingdom of|nation in|bordered by|population of|capital city|gdp |official language)\b/],
    ['Cities', /\b(city |town |village |municipality|metropolitan|urban area|borough|district|population.*census|located in.*county|founded.*year)\b/],
    ['Geography', /\b(river |mountain|lake |ocean|sea |island|peninsula|continent|desert|glacier|volcano|canyon|valley|plateau|rainforest|tundra|climate.*region)\b/],

    // Culture & Entertainment
    ['Movies & TV', /\b(film |movie|directed by|starring|box office|academy award|oscar|television series|tv series|sitcom|drama series|streaming|netflix|produced by.*studio)\b/],
    ['Music', /\b(song |album |single |genre.*music|music.*genre|billboard|grammy|rock music|pop music|jazz|blues|classical music|hip hop|electronic music|concert|musical)\b/],
    ['Literature', /\b(novel |book |poem |literary|fiction|non.fiction|chapter|published by|bestsell|library|manuscript|epic poem|short story|anthology)\b/],
    ['Art', /\b(painting|sculpture|artwork|gallery|museum|exhibition|canvas|portrait|landscape.*paint|impressionis|surrealis|abstract.*art|renaissance.*art|masterpiece)\b/],
    ['Sports', /\b(sport|championship|tournament|league|world cup|olympic|match |game.*score|goal |point.*scored|team.*win|season.*record|trophy|medal|athletic)\b/],

    // Other specific categories
    ['Mythology', /\b(mythology|mythological|myth |legend |deity|god of|goddess|folklore|fairy tale|mythical|epic.*ancient|divine|demigod|pantheon)\b/],
    ['Philosophy & Religion', /\b(philosophy|philosopher|theology|religion|religious|spiritual|belief|doctrine|church|mosque|temple|buddhis|hinduis|christian|islam|judai|atheism|ethics|metaphysic)\b/],
    ['Wars & Battles', /\b(war |battle of|siege|conflict|invasion|military.*campaign|army|navy|troops|soldier|weapon|fought in|casualties|surrender|armistice|warfare)\b/],
    ['Weather & Climate', /\b(weather|climate|temperature|hurricane|typhoon|tornado|flood|drought|rainfall|monsoon|el ni|meteorolog|atmospheric|storm|blizzard)\b/],
    ['Inventions', /\b(invented|invention|patent|innovati|breakthrough|pioneer|first.*create|developed.*device|prototype|revolutioniz)\b/],
    ['Language', /\b(language|linguistic|dialect|grammar|alphabet|script|spoken in|writing system|etymology|vocabulary|phonolog|morpholog)\b/],
    ['Games & Hobbies', /\b(board game|card game|video game|puzzle|hobby|chess|poker|gambling|casino|dice|tabletop|esport|gaming|collectible)\b/],

    // History (broad — catch-all for historical content)
    ['History', /\b(century|ancient|medieval|empire|dynasty|revolution|treaty|historic|archaeological|civilization|era |reign|colonial|pre.war|post.war|founding of)\b/],

    // Generic people (last resort for person articles)
    ['People', /\b(born |died |was an? |is an? |he was|she was|his |her |who was|biography)\b/],
  ];

  for (const [category, pattern] of patterns) {
    if (pattern.test(text)) return category;
  }

  return 'General';
}

// --- Wikipedia API helpers ---

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

// --- Card generation ---

export async function generateCard(rarity: Rarity): Promise<WikiCard | null> {
  let summary: WikiSummary | null = null;
  let rankedArticle: RankedArticle | null = null;

  if (rarity === 'C' || rarity === 'UC') {
    summary = await fetchRandomArticle();
    if (rarity === 'UC' && summary) {
      let attempts = 0;
      while (attempts < 3 && summary && (!summary.extract || summary.extract.length < 50)) {
        summary = await fetchRandomArticle();
        attempts++;
      }
    }
  } else {
    rankedArticle = await pickArticleFromTier(rarity);
    if (rankedArticle) {
      summary = await fetchArticleSummary(rankedArticle.title);
    }
    if (!summary) {
      summary = await fetchRandomArticle();
      rankedArticle = null;
    }
  }

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
    category: detectCategory(summary.title, summary.extract || ''),
    atk: calculateATK(estimatedPageviews, rarity),
    def: calculateDEF(meta.length || summary.extract?.length || 100, rarity),
    pageviews: estimatedPageviews,
    articleLength: meta.length,
    languages: meta.languages,
    wikiUrl: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
    wikiRank: rankedArticle?.rank ?? null,
    dailyViews: rankedArticle?.views ?? null,
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
