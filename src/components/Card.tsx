'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WikiCard, RARITY_CONFIG, Rarity } from '@/types';
import { getBindersForCard } from '@/lib/binders';

interface CardProps {
  card: WikiCard;
  isRevealed?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

function getRarityBorderStyle(rarity: Rarity): string {
  switch (rarity) {
    case 'C': return 'border-gray-700 shadow-md';
    case 'UC': return 'border-slate-400 shadow-lg shadow-slate-500/20';
    case 'R': return 'border-green-500 shadow-lg shadow-green-500/30';
    case 'SR': return 'border-purple-500 shadow-xl shadow-purple-500/40';
    case 'SSR': return 'border-yellow-500 shadow-xl shadow-yellow-500/50';
    case 'UR': return 'border-red-500 shadow-2xl shadow-red-500/50';
    case 'LR': return 'shadow-2xl shadow-purple-500/60';
    default: return 'border-gray-700';
  }
}

function getImageHeight(rarity: Rarity, size: 'small' | 'medium' | 'large'): string {
  const config = RARITY_CONFIG[rarity];
  if (size === 'small') {
    switch (config.imageSize) {
      case 'none': return 'h-0';
      case 'small': return 'h-16';
      case 'medium': return 'h-24';
      case 'large': return 'h-28';
      case 'full': return 'h-full';
    }
  }
  switch (config.imageSize) {
    case 'none': return 'h-0';
    case 'small': return 'h-28';
    case 'medium': return 'h-36';
    case 'large': return 'h-48';
    case 'full': return 'h-full';
  }
}

function CardPills({ card, size }: { card: WikiCard; size: 'small' | 'medium' | 'large' }) {
  const binders = useMemo(() => getBindersForCard(card.title), [card.title]);
  const isSmall = size === 'small';

  return (
    <div className="flex gap-1 flex-wrap">
      <span className={`${isSmall ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'} rounded-full bg-white/10 text-gray-300 font-medium`}>
        {card.category}
      </span>
      {binders.map((b) => (
        <span
          key={b.name}
          className={`${isSmall ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'} rounded-full bg-yellow-500/15 text-yellow-400 font-medium`}
        >
          {b.icon} {b.name}
        </span>
      ))}
    </div>
  );
}

export default function Card({ card, isRevealed = true, size = 'medium', onClick }: CardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const config = RARITY_CONFIG[card.rarity];
  const isFullArt = config.imageSize === 'full';
  const hasImage = card.imageUrl && !imgFailed;

  const sizeClasses = {
    small: 'w-44 h-64',
    medium: 'w-64 h-96',
    large: 'w-72 h-[28rem]',
  };

  if (!isRevealed) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center cursor-pointer select-none`}
        onClick={onClick}
      >
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-600/30 font-serif">W</div>
          <div className="text-[10px] text-gray-600 mt-2 tracking-widest">TAP TO REVEAL</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-xl overflow-hidden relative cursor-pointer group ${getRarityBorderStyle(card.rarity)} ${card.rarity === 'LR' ? 'border-2 rainbow-border' : 'border-2'}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Holographic overlay for SSR+ */}
      {['SSR', 'UR', 'LR'].includes(card.rarity) && (
        <div className="absolute inset-0 z-20 pointer-events-none holo-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* LR rainbow glow */}
      {card.rarity === 'LR' && (
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-spin-slow opacity-60 blur-md -z-10" />
      )}

      {/* UR pulsing glow */}
      {card.rarity === 'UR' && (
        <div className="absolute -inset-1 rounded-xl bg-red-500/30 animate-pulse -z-10 blur-md" />
      )}

      {/* SSR shimmer glow */}
      {card.rarity === 'SSR' && (
        <div className="absolute -inset-0.5 rounded-xl bg-yellow-500/20 animate-pulse -z-10 blur-sm" />
      )}

      {isFullArt ? (
        // Full art layout (UR / LR)
        <div className={`relative w-full h-full ${!hasImage ? `bg-gradient-to-b ${config.bgGradient}` : ''}`}>
          {hasImage ? (
            <>
              <img
                src={card.imageUrl!}
                alt={card.title}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[120px] font-bold text-white/[0.04] select-none font-serif">W</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </>
          )}

          {/* Rarity badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm ${config.color}`}>
              {card.rarity}
            </span>
          </div>

          {/* NEW badge */}
          {card.isNew && (
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-black animate-pulse">NEW</span>
            </div>
          )}

          {/* Card info overlay */}
          <div className={`absolute bottom-0 left-0 right-0 z-10 ${size === 'small' ? 'p-2.5' : 'p-4'}`}>
            <div className="mb-1"><CardPills card={card} size={size} /></div>
            <h3 className={`text-white font-bold leading-tight mb-0.5 drop-shadow-lg ${size === 'small' ? 'text-sm' : 'text-lg'}`}>
              {card.title}
            </h3>
            {size !== 'small' && (
              <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2 drop-shadow">
                {card.extract}
              </p>
            )}

            <div className={`flex ${size === 'small' ? 'gap-2 mt-1.5' : 'gap-3 mt-3'}`}>
              <div className={`flex-1 bg-black/50 backdrop-blur-sm rounded-lg text-center ${size === 'small' ? 'px-2 py-1' : 'px-3 py-2'}`}>
                <div className={`text-red-400 font-bold tracking-widest ${size === 'small' ? 'text-[8px]' : 'text-[10px]'}`}>ATK</div>
                <div className={`text-white font-bold font-mono ${size === 'small' ? 'text-xs' : 'text-base'}`}>{card.atk.toLocaleString()}</div>
              </div>
              <div className={`flex-1 bg-black/50 backdrop-blur-sm rounded-lg text-center ${size === 'small' ? 'px-2 py-1' : 'px-3 py-2'}`}>
                <div className={`text-blue-400 font-bold tracking-widest ${size === 'small' ? 'text-[8px]' : 'text-[10px]'}`}>DEF</div>
                <div className={`text-white font-bold font-mono ${size === 'small' ? 'text-xs' : 'text-base'}`}>{card.def.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Standard card layout (C through SSR)
        <div className={`w-full h-full bg-gradient-to-b ${config.bgGradient} flex flex-col`}>
          {/* Header */}
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs font-bold shrink-0 ${config.color}`}>{card.rarity}</span>
              <span className="text-white text-xs font-semibold truncate">{card.title}</span>
            </div>
            {card.isNew && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500 text-black shrink-0 ml-2">NEW</span>
            )}
          </div>

          {/* Image */}
          {hasImage && config.imageSize !== 'none' ? (
            <div className={`mx-3 ${getImageHeight(card.rarity, size)} rounded-lg overflow-hidden bg-black/30 shrink-0`}>
              <img
                src={card.imageUrl!}
                alt={card.title}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            </div>
          ) : (
            <div className="mx-3 h-20 flex items-center justify-center relative shrink-0">
              <span className="text-[80px] font-bold text-white/[0.04] select-none font-serif">W</span>
            </div>
          )}

          {/* Extract */}
          <div className="flex-1 px-3 py-1 overflow-hidden min-h-0">
            <p className={`text-gray-400 text-[10px] leading-relaxed ${size === 'small' ? 'line-clamp-2' : 'line-clamp-4'}`}>
              {card.extract}
            </p>
          </div>

          {/* Category & binder pills */}
          <div className="px-3 pb-1 shrink-0">
            <CardPills card={card} size={size} />
          </div>

          {/* Stats */}
          <div className="flex border-t border-white/10 mt-auto shrink-0">
            <div className={`flex-1 text-center border-r border-white/10 ${size === 'small' ? 'px-2 py-1' : 'px-3 py-2'}`}>
              <div className="text-red-400 text-[9px] font-bold tracking-widest">ATK</div>
              <div className={`text-white font-bold font-mono ${size === 'small' ? 'text-xs' : 'text-sm'}`}>{card.atk.toLocaleString()}</div>
            </div>
            <div className={`flex-1 text-center ${size === 'small' ? 'px-2 py-1' : 'px-3 py-2'}`}>
              <div className="text-blue-400 text-[9px] font-bold tracking-widest">DEF</div>
              <div className={`text-white font-bold font-mono ${size === 'small' ? 'text-xs' : 'text-sm'}`}>{card.def.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate badge */}
      {card.duplicateCount > 0 && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 z-30">
          <span className="text-yellow-400 text-[10px] font-bold">x{card.duplicateCount + 1}</span>
        </div>
      )}
    </motion.div>
  );
}
