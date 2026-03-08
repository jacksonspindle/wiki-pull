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

// Curated article pools by rarity tier
export const TOP_ARTICLES: Record<string, string[]> = {
  LR: [
    'United States', 'World War II', 'Albert Einstein', 'Earth',
    'Philosophy', 'Wikipedia', 'Mathematics', 'Universe', 'Science', 'History',
  ],
  UR: [
    'George Washington', 'Abraham Lincoln', 'Leonardo da Vinci', 'William Shakespeare',
    'Isaac Newton', 'Charles Darwin', 'Napoleon', 'Cleopatra',
    'Alexander the Great', 'Julius Caesar', 'Nikola Tesla',
    'Martin Luther King Jr.', 'Mahatma Gandhi', 'Nelson Mandela', 'Barack Obama',
    'Moon', 'Sun', 'Mars', 'Solar System', 'DNA', 'Evolution', 'Gravity',
    'Democracy', 'Olympic Games', 'World War I', 'Cold War', 'Renaissance',
    'Roman Empire', 'Ancient Greece', 'Ancient Egypt', 'China', 'India',
    'United Kingdom', 'Japan', 'France', 'Germany', 'Russia', 'Brazil', 'Canada',
  ],
  SSR: [
    'Artificial intelligence', 'Climate change', 'Bitcoin', 'Internet',
    'Computer', 'Electricity', 'Light', 'Water', 'Oxygen', 'Carbon',
    'Human', 'Brain', 'Heart', 'Cancer', 'Virus',
    'Football', 'Basketball', 'Baseball', 'Tennis', 'Cricket',
    'Beethoven', 'Mozart', 'New York City', 'London', 'Paris', 'Tokyo', 'Rome',
    'Africa', 'Europe', 'Asia', 'Australia', 'Antarctica',
    'Lion', 'Eagle', 'Whale', 'Dolphin', 'Elephant',
    'Gold', 'Diamond', 'Hydrogen', 'Helium',
    'Plato', 'Aristotle', 'Socrates', 'Confucius',
    'French Revolution', 'American Revolution',
    'Periodic table', 'Black hole', 'Galaxy', 'Milky Way', 'Big Bang',
    'Quantum mechanics', 'Apple Inc.', 'Google', 'Microsoft',
    'Elon Musk', 'Steve Jobs', 'Taylor Swift', 'Michael Jackson', 'The Beatles',
    'Harry Potter', 'Star Wars', 'Marvel Cinematic Universe',
    'FIFA World Cup', 'Vaccine', 'Dinosaur', 'Volcano', 'Earthquake',
    'Nuclear weapon', 'Space exploration', 'Moon landing',
    'Human rights', 'United Nations', 'Psychology', 'Economics',
    'Coffee', 'Tea', 'Chocolate', 'Dog', 'Cat', 'Tiger',
    'Painting', 'Architecture', 'Novel', 'Poetry',
    'Physics', 'Biology', 'Chemistry', 'Geology',
    'Airplane', 'Automobile', 'English language',
    'Bible', 'Quran', 'Christmas',
  ],
  SR: [
    'Penguin', 'Octopus', 'Jellyfish', 'Coral reef', 'Rainforest',
    'Glacier', 'Desert', 'Copper', 'Silver', 'Platinum', 'Uranium',
    'Neptune', 'Saturn', 'Jupiter', 'Venus', 'Mercury (planet)',
    'Hubble Space Telescope', 'International Space Station', 'SpaceX',
    'Chopin', 'Tchaikovsky', 'Vivaldi',
    'Van Gogh', 'Picasso', 'Monet', 'Rembrandt', 'Michelangelo',
    'Mark Twain', 'Charles Dickens', 'Jane Austen',
    'Thomas Edison', 'Marie Curie', 'Galileo Galilei',
    'Sigmund Freud', 'Friedrich Nietzsche', 'Immanuel Kant',
    'Genghis Khan', 'Charlemagne', 'Elizabeth I',
    'Samurai', 'Knight', 'Viking',
    'Pyramid', 'Colosseum', 'Great Wall of China', 'Taj Mahal', 'Stonehenge',
    'Great Barrier Reef', 'Yellowstone',
    'Eiffel Tower', 'Statue of Liberty',
    'Mona Lisa', 'Hamlet', 'Romeo and Juliet',
    'The Odyssey', 'Magna Carta',
    'Penicillin', 'Cheetah', 'Giraffe', 'Gorilla',
    'Great white shark', 'Blue whale',
    'Bald eagle', 'Sushi', 'Pizza', 'Pasta',
    'Chess', 'Marathon', 'Jazz', 'Blues', 'Hip hop music',
    'Telescope', 'Microscope', 'Printing press',
  ],
  R: [
    'Capybara', 'Axolotl', 'Platypus', 'Pangolin', 'Narwhal',
    'Tardigrade', 'Mantis shrimp', 'Sea otter', 'Red panda',
    'Aurora borealis', 'Lightning', 'Rainbow', 'Tornado',
    'Pompeii', 'Troy', 'Machu Picchu', 'Angkor Wat', 'Petra',
    'Fibonacci number', 'Pi', 'Golden ratio', 'Infinity', 'Zero',
    'Photosynthesis', 'Mitosis', 'Entropy',
    'Espresso', 'Champagne', 'Ramen', 'Croissant', 'Taco',
    'Haiku', 'Sonnet', 'Gothic architecture', 'Art Deco', 'Brutalism',
    'Alchemy', 'Astrology', 'Mythology', 'Folklore', 'Fairy tale',
    'Morse code', 'Braille', 'Hieroglyph',
    'Katana', 'Longbow', 'Trebuchet',
    'Bonsai', 'Flamenco', 'Tango', 'Ballet',
    'Fresco', 'Mosaic', 'Stained glass',
    'Abacus', 'Sundial', 'Astrolabe',
    'Submarine', 'Galleon', 'Hot air balloon',
    'Origami', 'Calligraphy', 'Pottery',
  ],
};

function pickArticleFromTier(rarity: Rarity): string | null {
  const tier = TOP_ARTICLES[rarity];
  if (!tier) return null;
  return tier[Math.floor(Math.random() * tier.length)];
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
  let summary: WikiSummary | null = null;

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
    const title = pickArticleFromTier(rarity);
    if (title) {
      summary = await fetchArticleSummary(title);
    }
    if (!summary) {
      summary = await fetchRandomArticle();
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
