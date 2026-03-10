'use client';

import { WikiCard } from '@/types';

export default function RarityReason({ card }: { card: WikiCard }) {
  const { rarity, wikiRank, dailyViews, title, pageviewDate } = card;

  if (wikiRank && dailyViews) {
    const viewsFormatted = dailyViews.toLocaleString();
    const ordinal = wikiRank === 1 ? '1st' : wikiRank === 2 ? '2nd' : wikiRank === 3 ? '3rd' : `${wikiRank}th`;

    // Build a link to the Wikimedia Topviews tool for the specific date
    let sourceUrl: string | null = null;
    if (pageviewDate) {
      // pageviewDate is "YYYY/MM/DD", topviews wants "YYYY-MM-DD"
      const datePart = pageviewDate.replace(/\//g, '-');
      sourceUrl = `https://pageviews.wmcloud.org/topviews/?project=en.wikipedia.org&platform=all-access&date=${datePart}&excludes=`;
    }

    return (
      <>
        <span className="text-gray-300">&ldquo;{title}&rdquo;</span> is the{' '}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium underline decoration-dotted underline-offset-2 hover:text-yellow-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {ordinal} most-viewed
          </a>
        ) : (
          <span className="text-white font-medium">{ordinal} most-viewed</span>
        )}{' '}
        article on Wikipedia right now with <span className="text-white font-medium">{viewsFormatted}</span> views yesterday.
      </>
    );
  }

  // Fallback for cards without rank data
  const reasons: Record<string, string> = {
    LR: 'One of the most-viewed pages on all of Wikipedia.',
    UR: 'Among the top 50 most-visited Wikipedia articles.',
    SSR: 'In the top 200 most-trafficked articles on Wikipedia.',
    SR: 'Ranks in the top 500 most-viewed Wikipedia pages.',
    R: 'A top-1000 Wikipedia article by daily pageviews.',
  };

  return <>{reasons[rarity] || ''}</>;
}
