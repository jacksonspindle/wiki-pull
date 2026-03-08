'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WikiCard, Rarity, CardCategory, RARITY_CONFIG, RARITY_ORDER, Collection as CollectionType } from '@/types';
import { getStardustValue } from '@/lib/rarity';
import { convertDuplicateToStardust } from '@/lib/storage';
import Card from './Card';

interface CollectionProps {
  collection: CollectionType;
  onUpdate: () => void;
}

type SortOption = 'newest' | 'rarity' | 'atk' | 'def' | 'alpha';

export default function Collection({ collection, onUpdate }: CollectionProps) {
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<CardCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<WikiCard | null>(null);

  const filteredCards = useMemo(() => {
    let cards = [...collection.cards];

    if (filterRarity !== 'all') {
      cards = cards.filter(c => c.rarity === filterRarity);
    }

    if (filterCategory !== 'all') {
      cards = cards.filter(c => c.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.extract.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'newest':
        cards.sort((a, b) => new Date(b.pulledAt).getTime() - new Date(a.pulledAt).getTime());
        break;
      case 'rarity':
        cards.sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
        break;
      case 'atk':
        cards.sort((a, b) => b.atk - a.atk);
        break;
      case 'def':
        cards.sort((a, b) => b.def - a.def);
        break;
      case 'alpha':
        cards.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return cards;
  }, [collection.cards, filterRarity, filterCategory, sortBy, searchQuery]);

  const stats = useMemo(() => {
    const rarityCount: Record<Rarity, number> = { C: 0, UC: 0, R: 0, SR: 0, SSR: 0, UR: 0, LR: 0 };
    collection.cards.forEach(c => { rarityCount[c.rarity]++; });
    return { rarityCount, total: collection.cards.length };
  }, [collection.cards]);

  const handleConvertDuplicate = (card: WikiCard) => {
    if (card.duplicateCount > 0) {
      convertDuplicateToStardust(card.title);
      onUpdate();
    }
  };

  // Dynamically get categories that actually exist in the collection
  const categories = useMemo(() => {
    const cats = new Set(collection.cards.map(c => c.category));
    return Array.from(cats).sort() as CardCategory[];
  }, [collection.cards]);

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 max-w-4xl mx-auto">
      {/* Stats header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Collection</h2>

        <div className="flex gap-3 flex-wrap mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
            <div className="text-gray-500 text-[10px] font-bold tracking-wider">UNIQUE CARDS</div>
            <div className="text-white font-bold text-lg">{stats.total}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
            <div className="text-gray-500 text-[10px] font-bold tracking-wider">PACKS OPENED</div>
            <div className="text-white font-bold text-lg">{collection.packsOpened}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
            <div className="text-gray-500 text-[10px] font-bold tracking-wider">TOTAL PULLS</div>
            <div className="text-white font-bold text-lg">{collection.totalPulls}</div>
          </div>
        </div>

        {/* Rarity breakdown */}
        <div className="flex gap-3 flex-wrap">
          {RARITY_ORDER.map(r => (
            <div key={r} className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${RARITY_CONFIG[r].color}`}>{r}</span>
              <span className="text-xs text-gray-600">{stats.rarityCount[r]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
        />

        <div className="flex gap-3 flex-wrap items-center">
          {/* Rarity filter pills */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterRarity('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterRarity === 'all' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {RARITY_ORDER.map(r => (
              <button
                key={r}
                onClick={() => setFilterRarity(filterRarity === r ? 'all' : r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  filterRarity === r ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as CardCategory | 'all')}
            className="bg-gray-800 border border-gray-700 rounded-md text-xs text-gray-300 px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 border border-gray-700 rounded-md text-xs text-gray-300 px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="rarity">Highest Rarity</option>
            <option value="atk">Highest ATK</option>
            <option value="def">Highest DEF</option>
            <option value="alpha">A &rarr; Z</option>
          </select>
        </div>
      </div>

      {/* Cards grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4 opacity-20">W</div>
          <p className="text-gray-500 text-sm">
            {collection.cards.length === 0
              ? 'No cards yet. Open some packs!'
              : 'No cards match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
            >
              <Card
                card={card}
                size="small"
                onClick={() => setSelectedCard(card)}
              />
            </motion.div>
          ))}
        </div>
      )}

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

                {selectedCard.duplicateCount > 0 && (
                  <button
                    onClick={() => {
                      handleConvertDuplicate(selectedCard);
                      setSelectedCard(null);
                    }}
                    className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg transition-colors"
                  >
                    Convert to &#10022;{getStardustValue(selectedCard.rarity)}
                  </button>
                )}
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
