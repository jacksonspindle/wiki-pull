'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collection as CollectionType, WikiCard } from '@/types';
import { BINDERS, getEntryDisplayName } from '@/lib/binders';
import Card from './Card';

interface BindersProps {
  collection: CollectionType;
}

export default function Binders({ collection }: BindersProps) {
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<WikiCard | null>(null);

  // Build a lookup of collected card titles (lowercase for case-insensitive matching)
  const collectedTitles = useMemo(() => {
    const map = new Map<string, WikiCard>();
    for (const card of collection.cards) {
      map.set(card.title.toLowerCase(), card);
    }
    return map;
  }, [collection.cards]);

  const selectedBinder = BINDERS.find(b => b.id === selectedBinderId);

  // Compute progress for each binder
  const binderProgress = useMemo(() => {
    const progress: Record<string, number> = {};
    for (const binder of BINDERS) {
      let collected = 0;
      for (const entry of binder.entries) {
        if (collectedTitles.has(entry.title.toLowerCase())) {
          collected++;
        }
      }
      progress[binder.id] = collected;
    }
    return progress;
  }, [collectedTitles]);

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedBinder ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-white mb-2">Binders</h2>
            <p className="text-gray-500 text-sm mb-6">
              Collect cards to fill themed binders. Cards you pull that match a binder entry will automatically fill in.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BINDERS.map((binder, i) => {
                const collected = binderProgress[binder.id] || 0;
                const total = binder.entries.length;
                const pct = Math.round((collected / total) * 100);

                return (
                  <motion.button
                    key={binder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedBinderId(binder.id)}
                    className={`relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br ${binder.color} p-5 text-left transition-all hover:border-gray-600 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{binder.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg leading-tight">{binder.name}</h3>
                        <p className="text-gray-400 text-xs mt-1">{binder.description}</p>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-400 text-[11px] font-mono">
                              {collected}/{total}
                            </span>
                            <span className={`text-[11px] font-bold ${
                              pct === 100 ? 'text-yellow-400' : 'text-gray-500'
                            }`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                pct === 100
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                  : 'bg-gradient-to-r from-white/60 to-white/40'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Completion badge */}
                    {pct === 100 && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-black">
                          COMPLETE
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedBinderId(null)}
                className="text-gray-400 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700"
              >
                &larr; Back
              </button>
              <span className="text-2xl">{selectedBinder.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedBinder.name}</h2>
                <p className="text-gray-500 text-xs">
                  {binderProgress[selectedBinder.id] || 0}/{selectedBinder.entries.length} collected
                </p>
              </div>
            </div>

            {/* Entries grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-5">
              {selectedBinder.entries.map((entry, i) => {
                const card = collectedTitles.get(entry.title.toLowerCase());
                const displayName = getEntryDisplayName(entry);

                return (
                  <motion.div
                    key={entry.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.5) }}
                  >
                    {card ? (
                      <button
                        onClick={() => setSelectedCard(card)}
                        className="w-full"
                      >
                        <Card card={card} size="small" />
                      </button>
                    ) : (
                      <div className="w-full aspect-[11/16] rounded-xl bg-gray-900/60 border-2 border-gray-800/50 border-dashed flex flex-col items-center justify-center p-3">
                        <div className="text-3xl font-bold text-gray-800/40 font-serif mb-2">?</div>
                        <p className="text-gray-600 text-[11px] text-center font-medium leading-tight">
                          {displayName}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card detail modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center gap-5"
            >
              <Card card={selectedCard} size="large" />

              <div className="flex gap-3 flex-wrap justify-center">
                <a
                  href={selectedCard.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Read on Wikipedia
                </a>
              </div>

              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
