'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RARITY_CONFIG, RARITY_ORDER, Rarity } from '@/types';
import { fetchTopArticles, getArticlesForTier, TIER_RANGES, RankedArticle } from '@/lib/wikipedia';
import { useState, useEffect } from 'react';

const TIER_INFO: { rarity: Rarity; description: string }[] = [
  { rarity: 'LR', description: 'The absolute peak of Wikipedia — the most viewed articles on the entire platform.' },
  { rarity: 'UR', description: 'Massively popular pages — world-famous figures, countries, and concepts.' },
  { rarity: 'SSR', description: 'Highly trafficked articles — major cultural topics, science, and entertainment.' },
  { rarity: 'SR', description: 'Well-known topics that draw significant readership.' },
  { rarity: 'R', description: 'Notable articles in the top 1000 — interesting, but not headline-level.' },
];

function TierList() {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [articles, setArticles] = useState<RankedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopArticles()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      {TIER_INFO.map(({ rarity, description }) => {
        const tierArticles = getArticlesForTier(rarity, articles);
        const isExpanded = expandedTier === rarity;
        const [start, end] = TIER_RANGES[rarity];
        return (
          <div key={rarity} className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedTier(isExpanded ? null : rarity)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold text-sm ${RARITY_CONFIG[rarity].color}`}>{rarity}</span>
                <span className="text-gray-400 text-xs">{RARITY_CONFIG[rarity].name}</span>
                <span className="text-gray-600 text-xs font-mono">
                  rank #{start}–{end}
                </span>
              </div>
              <span className={`text-gray-500 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                &#9660;
              </span>
            </button>
            {isExpanded && (
              <div className="px-4 pb-3 border-t border-gray-800">
                <p className="text-gray-500 text-[10px] mt-2 mb-2">{description}</p>
                {loading ? (
                  <p className="text-gray-600 text-[10px] italic">Loading current rankings...</p>
                ) : tierArticles.length > 0 ? (
                  <>
                    <p className="text-gray-600 text-[10px] mb-1.5">
                      Currently {tierArticles.length} articles (based on recent Wikipedia traffic):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tierArticles.map((a) => (
                        <span
                          key={a.title}
                          className={`px-1.5 py-0.5 rounded text-[10px] bg-gray-800 border border-gray-700 ${RARITY_CONFIG[rarity].color}`}
                          title={`#${a.rank} — ${a.views.toLocaleString()} views`}
                        >
                          {a.title}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-600 text-[10px] italic">Could not load current rankings. Data will load when you open a pack.</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* C and UC */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`font-bold text-sm ${RARITY_CONFIG.UC.color}`}>UC</span>
          <span className="text-gray-400 text-xs">{RARITY_CONFIG.UC.name}</span>
          <span className="text-gray-600 text-xs font-mono">random API</span>
        </div>
        <p className="text-gray-500 text-[10px] mt-1">Any Wikipedia article with a reasonable extract (retries short stubs).</p>
      </div>
      <div className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`font-bold text-sm ${RARITY_CONFIG.C.color}`}>C</span>
          <span className="text-gray-400 text-xs">{RARITY_CONFIG.C.name}</span>
          <span className="text-gray-600 text-xs font-mono">random API</span>
        </div>
        <p className="text-gray-500 text-[10px] mt-1">Any of Wikipedia&apos;s 6.8M+ English articles, completely random.</p>
      </div>
    </div>
  );
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  // Calculate actual percentages from weights
  const totalWeight = RARITY_ORDER.reduce((sum, r) => sum + RARITY_CONFIG[r].weight, 0);
  const percentages = Object.fromEntries(
    RARITY_ORDER.map(r => [r, ((RARITY_CONFIG[r].weight / totalWeight) * 100)])
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-white">How It Works</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none p-1"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-8">

              {/* === PULL ODDS === */}
              <section>
                <h3 className="text-yellow-500 font-bold text-sm tracking-wider mb-3">PULL ODDS</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Each pack contains 5 cards. When you open a pack, each card&apos;s rarity is rolled independently using these base probabilities:
                </p>

                <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Rarity</th>
                        <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">Name</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">Chance</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">~1 in every</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...RARITY_ORDER].reverse().map((r) => {
                        const pct = percentages[r];
                        const oneIn = Math.round(100 / pct);
                        return (
                          <tr key={r} className="border-b border-gray-800/50 last:border-0">
                            <td className="px-4 py-2.5">
                              <span className={`font-bold text-xs ${RARITY_CONFIG[r].color}`}>{r}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-300 text-xs">{RARITY_CONFIG[r].name}</td>
                            <td className="px-4 py-2.5 text-right text-white font-mono text-xs">
                              {pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}%
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-400 font-mono text-xs">
                              {oneIn} pulls
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-500 text-xs mt-0.5">&#9670;</span>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      <span className="text-gray-300 font-medium">No pity system.</span> Every single pull is a true independent random roll. There are no rate boosts, no guarantees, and no safety nets. Good luck.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-500 text-xs mt-0.5">&#9670;</span>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      <span className="text-gray-300 font-medium">Gold Pack:</span> Every 10th pack, the last card is guaranteed SR or higher.
                    </p>
                  </div>
                </div>
              </section>

              {/* === WHERE CARDS COME FROM === */}
              <section>
                <h3 className="text-yellow-500 font-bold text-sm tracking-wider mb-3">WHERE CARDS COME FROM</h3>

                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mb-4">
                  <div className="text-blue-400 text-xs font-bold mb-2">DATA SOURCE</div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Card pools for R and above are pulled from <span className="text-white font-medium">Wikimedia&apos;s Pageviews API</span> — the same data Wikipedia itself uses. Articles are ranked by <span className="text-white font-medium">actual pageview count</span> from the past few days. The most-viewed articles on all of Wikipedia become the rarest cards.
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                    <div className="text-green-400 text-xs font-bold mb-2">RANKED POOL (R, SR, SSR, UR, LR)</div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      The top ~1,000 most-viewed Wikipedia articles are fetched and ranked. Each rarity tier maps to a rank range. The pool <span className="text-white font-medium">updates automatically</span> based on real-world Wikipedia traffic — if something trends globally, it enters the rare card pool.
                    </p>
                  </div>
                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-300 text-xs font-bold mb-2">RANDOM WIKIPEDIA (C, UC)</div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Common and Uncommon cards are fetched from <span className="text-white font-medium">Wikipedia&apos;s random article API</span>. Any of the 6.8 million+ English Wikipedia articles can appear. There is no fixed list — every pull is a surprise.
                    </p>
                  </div>
                </div>

                <h3 className="text-yellow-500 font-bold text-sm tracking-wider mb-3">CURRENT ARTICLE POOLS</h3>
                <p className="text-gray-400 text-xs mb-3">
                  These are the <span className="text-white">live rankings</span> based on recent Wikipedia pageview data. Hover/hold an article to see its rank and view count. Tap a tier to expand.
                </p>

                <TierList />
              </section>

              {/* === CARD STATS === */}
              <section>
                <h3 className="text-yellow-500 font-bold text-sm tracking-wider mb-3">CARD STATS</h3>
                <div className="space-y-3">
                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                    <div className="text-red-400 text-xs font-bold mb-1">ATK (POPULARITY)</div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Derived from the article&apos;s pageview count, scaled logarithmically and multiplied by a rarity bonus (C: 0.5x up to LR: 2.5x). Max: 15,000. Represents how famous the topic is.
                    </p>
                  </div>
                  <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                    <div className="text-blue-400 text-xs font-bold mb-1">DEF (DEPTH)</div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Derived from the article&apos;s content length in bytes, scaled logarithmically and multiplied by the same rarity bonus. Max: 15,000. Represents how detailed the topic&apos;s coverage is.
                    </p>
                  </div>
                </div>
              </section>

              {/* === CATEGORIES === */}
              <section>
                <h3 className="text-yellow-500 font-bold text-sm tracking-wider mb-3">CARD CATEGORIES</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Every card is automatically tagged with a category based on its Wikipedia content:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'People', 'World Leaders', 'Scientists', 'Artists & Musicians', 'Athletes',
                    'Authors & Writers', 'Countries', 'Cities', 'Landmarks', 'Geography',
                    'Animals', 'Plants', 'Food & Drink', 'Science', 'Technology',
                    'Space & Astronomy', 'Mathematics', 'Medicine', 'History', 'Wars & Battles',
                    'Philosophy & Religion', 'Sports', 'Movies & TV', 'Music', 'Literature',
                    'Art', 'Architecture', 'Mythology', 'Weather & Climate', 'Inventions',
                    'Games & Hobbies', 'Language', 'Nature', 'General',
                  ].map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </section>

              {/* === DUPLICATES === */}
              <section className="pb-2">
                <h3 className="text-yellow-500 font-bold text-sm tracking-wider mb-3">DUPLICATES & STARDUST</h3>
                <p className="text-gray-400 text-sm">
                  Pulling a card you already own increments its duplicate counter. You can convert duplicates into Stardust currency:
                </p>
                <div className="mt-3 bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-7 text-center">
                    {RARITY_ORDER.map((r) => {
                      const values: Record<string, number> = { C: 5, UC: 15, R: 50, SR: 150, SSR: 500, UR: 1500, LR: 5000 };
                      return (
                        <div key={r} className="px-2 py-2.5 border-r border-gray-800 last:border-0">
                          <div className={`text-[10px] font-bold ${RARITY_CONFIG[r].color}`}>{r}</div>
                          <div className="text-white text-xs font-mono mt-1">&#10022;{values[r]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
