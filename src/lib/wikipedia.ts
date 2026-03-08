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

function pickArticleFromTier(rarity: Rarity): string | null {
  const tier = TOP_ARTICLES[rarity];
  if (!tier) return null;
  return tier[Math.floor(Math.random() * tier.length)];
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
    category: detectCategory(summary.title, summary.extract || ''),
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
