'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WikiCard, RARITY_CONFIG, Rarity, RARITY_ORDER } from '@/types';
import { playCardFlip, playCardReveal } from '@/lib/sounds';
import Card from './Card';

interface CardRevealProps {
  cards: WikiCard[];
  onComplete: () => void;
}

function getRevealConfig(rarity: Rarity) {
  const rarityIndex = RARITY_ORDER.indexOf(rarity);
  return {
    flashColor: {
      C: 'transparent',
      UC: 'rgba(148, 163, 184, 0.1)',
      R: 'rgba(34, 197, 94, 0.15)',
      SR: 'rgba(168, 85, 247, 0.25)',
      SSR: 'rgba(234, 179, 8, 0.35)',
      UR: 'rgba(239, 68, 68, 0.45)',
      LR: 'rgba(168, 85, 247, 0.5)',
    }[rarity],
    buildupDuration: Math.min(0.3 + rarityIndex * 0.15, 1.5),
    showParticles: rarityIndex >= 4,
    particleCount: rarityIndex >= 6 ? 40 : rarityIndex >= 5 ? 24 : rarityIndex >= 4 ? 14 : 0,
  };
}

function Particles({ count, color }: { count: number; color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360 + Math.random() * 20;
        const distance = 80 + Math.random() * 250;
        const size = 2 + Math.random() * 5;
        const duration = 0.6 + Math.random() * 0.8;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              left: '50%',
              top: '50%',
              boxShadow: `0 0 ${size * 3}px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{ duration, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

function RarityFlare({ rarity }: { rarity: Rarity }) {
  if (!['SSR', 'UR', 'LR'].includes(rarity)) return null;

  const colors: Record<string, string[]> = {
    SSR: ['#EAB308', '#F59E0B'],
    UR: ['#EF4444', '#DC2626', '#FF6B6B'],
    LR: ['#A855F7', '#EC4899', '#3B82F6', '#22C55E', '#EAB308', '#EF4444'],
  };

  const flareColors = colors[rarity] || [];

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
      {flareColors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 300 + i * 30,
            height: 300 + i * 30,
            background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
          }}
          initial={{ scale: 0, opacity: 0, rotate: i * 30 }}
          animate={{ scale: [0, 2.5, 1.8], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.4, delay: i * 0.08, ease: 'easeOut' }}
        />
      ))}

      {/* Central flash */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 10,
          height: 10,
          background: 'white',
          boxShadow: '0 0 60px 30px rgba(255,255,255,0.5)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 8, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function CardReveal({ cards, onComplete }: CardRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showFlare, setShowFlare] = useState(false);

  const currentCard = cards[currentIndex];
  const config = currentCard ? getRevealConfig(currentCard.rarity) : null;
  const rarityConfig = currentCard ? RARITY_CONFIG[currentCard.rarity] : null;

  const revealCard = useCallback(() => {
    if (isRevealed) {
      if (currentIndex < cards.length - 1) {
        setIsRevealed(false);
        setShowFlare(false);
        setCurrentIndex(prev => prev + 1);
        playCardFlip();
      } else {
        onComplete();
      }
      return;
    }

    // Play reveal sound scaled to rarity
    const rarityIndex = RARITY_ORDER.indexOf(currentCard.rarity);
    playCardReveal(rarityIndex);

    setShowFlash(true);
    setShowFlare(true);
    setTimeout(() => setShowFlash(false), 500);
    setIsRevealed(true);
  }, [isRevealed, currentIndex, cards.length, onComplete, currentCard]);

  if (!currentCard || !config || !rarityConfig) return null;

  const rarityIndex = RARITY_ORDER.indexOf(currentCard.rarity);
  const particleColor =
    currentCard.rarity === 'LR' ? '#A855F7' :
    currentCard.rarity === 'UR' ? '#EF4444' :
    currentCard.rarity === 'SSR' ? '#EAB308' : '#A855F7';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
      onClick={revealCard}
    >
      {/* Background aura for high-rarity reveals */}
      {isRevealed && rarityIndex >= 4 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            background: rarityIndex >= 6
              ? 'radial-gradient(ellipse at center, rgba(128,0,255,0.12) 0%, transparent 60%)'
              : rarityIndex >= 5
              ? 'radial-gradient(ellipse at center, rgba(220,38,38,0.1) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at center, rgba(234,179,8,0.08) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Progress dots */}
      <div className="absolute top-6 left-0 right-0 flex justify-center gap-2.5">
        {cards.map((c, i) => {
          const dotBg = i < currentIndex
            ? RARITY_CONFIG[c.rarity].borderColor.replace('border-', 'bg-')
            : i === currentIndex
            ? 'bg-white'
            : 'bg-gray-700';
          return (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${dotBg}`}
              animate={i === currentIndex ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              style={
                i < currentIndex
                  ? { boxShadow: `0 0 6px ${RARITY_CONFIG[c.rarity].borderColor.includes('yellow') ? '#EAB308' : RARITY_CONFIG[c.rarity].borderColor.includes('red') ? '#EF4444' : RARITY_CONFIG[c.rarity].borderColor.includes('purple') ? '#A855F7' : RARITY_CONFIG[c.rarity].borderColor.includes('green') ? '#22C55E' : '#9CA3AF'}` }
                  : {}
              }
            />
          );
        })}
      </div>

      <div className="text-gray-500 text-sm mb-4 select-none">
        {currentIndex + 1} / {cards.length}
      </div>

      {/* Screen flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none"
            style={{ backgroundColor: config.flashColor }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Rarity flare */}
      {isRevealed && showFlare && <RarityFlare rarity={currentCard.rarity} />}

      {/* Particles */}
      {isRevealed && config.showParticles && (
        <Particles count={config.particleCount} color={particleColor} />
      )}

      {/* Card */}
      <motion.div
        key={currentIndex}
        className="relative"
        style={{ perspective: 1200 }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={
          isRevealed
            ? { scale: 1, opacity: 1, rotateY: 0 }
            : { scale: 0.85, opacity: 1, rotateY: 180 }
        }
        transition={{
          type: 'spring',
          stiffness: 160,
          damping: 16,
          duration: config.buildupDuration,
        }}
      >
        {isRevealed ? (
          <Card card={currentCard} isRevealed={true} size="large" />
        ) : (
          <Card card={currentCard} isRevealed={false} size="large" />
        )}
      </motion.div>

      {/* Rarity label */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-center select-none"
          >
            <span className={`text-lg font-bold ${rarityConfig.color}`}>
              {rarityConfig.name}
            </span>
            {currentCard.isNew && (
              <motion.span
                className="ml-3 text-yellow-500 text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                &#9733; NEW
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap instruction */}
      <motion.div
        className="absolute bottom-12 text-gray-600 text-sm select-none"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isRevealed
          ? currentIndex < cards.length - 1
            ? 'Tap for next card'
            : 'Tap to finish'
          : 'Tap to reveal'}
      </motion.div>
    </div>
  );
}
