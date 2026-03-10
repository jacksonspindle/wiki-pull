import { NextResponse } from 'next/server';

export async function GET() {
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

    if (!res.ok) {
      return NextResponse.json({ error: `Pageviews API ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const rawArticles: { article: string; views: number }[] = data.items?.[0]?.articles || [];

    // Filter out non-content pages, then re-rank
    let rank = 0;
    const ranked: { title: string; views: number; rank: number }[] = [];
    for (const a of rawArticles) {
      const title = a.article;
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

    return NextResponse.json({ articles: ranked, date: `${year}/${month}/${day}` });
  } catch (e) {
    console.error('Top articles fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch top articles' }, { status: 500 });
  }
}
