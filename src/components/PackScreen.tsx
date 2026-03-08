'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WikiCard, Rarity } from '@/types';
import { rollRarity } from '@/lib/rarity';
import { generatePack } from '@/lib/wikipedia';
import {
  getGachaState, consumePack, regeneratePacks,
  isGoldPack, resetGoldCounter, addCardsToCollection,
} from '@/lib/storage';
import { playPackCrinkle, playTearProgress, playTearComplete, playPackOpen } from '@/lib/sounds';
import CardReveal from './CardReveal';
import Card from './Card';
import InfoModal from './InfoModal';

interface PackScreenProps {
  onCollectionUpdate: () => void;
}

type PackPhase = 'idle' | 'tearing' | 'torn' | 'opening' | 'loading' | 'revealing' | 'results';

export default function PackScreen({ onCollectionUpdate }: PackScreenProps) {
  const [gachaState, setGachaState] = useState(() => ({
    dailyPacks: 0, maxPacks: 0, lastRegenTime: '', pullsSinceGold: 0, pityCounter: 0,
  }));
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<PackPhase>('idle');
  const [tearProgress, setTearProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [pulledCards, setPulledCards] = useState<WikiCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const packRef = useRef<HTMLDivElement>(null);
  const tearStartX = useRef<number | null>(null);
  const lastTearSound = useRef(0);

  // Load gacha state from localStorage after mount
  useEffect(() => {
    setGachaState(getGachaState());
    setMounted(true);
  }, []);

  // Regenerate packs on interval
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const updated = regeneratePacks();
      setGachaState(updated);
    }, 10000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Track mouse position over pack for holographic effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!packRef.current) return;
    const rect = packRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });

    // Handle tearing
    if (phase === 'tearing' && tearStartX.current !== null) {
      const progress = Math.max(0, Math.min(1, (e.clientX - tearStartX.current) / (rect.width * 0.85)));
      setTearProgress(progress);

      // Play tear sound periodically
      const now = Date.now();
      if (now - lastTearSound.current > 60 && progress > 0.05) {
        playTearProgress();
        lastTearSound.current = now;
      }

      // Auto-complete at 80%
      if (progress >= 0.8) {
        completeTear();
      }
    }
  }, [phase]);

  // Start tear on mousedown in the tear zone (top 18% of pack)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'idle' || gachaState.dailyPacks <= 0) return;
    if (!packRef.current) return;

    const rect = packRef.current.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;

    // Only start tear if clicking in the top ~18% of the pack
    if (y <= 0.18) {
      tearStartX.current = e.clientX;
      setPhase('tearing');
      setTearProgress(0);
      playPackCrinkle();
    }
  }, [phase, gachaState.dailyPacks]);

  const handleMouseUp = useCallback(() => {
    if (phase === 'tearing') {
      if (tearProgress < 0.8) {
        // Didn't tear enough — snap back
        setPhase('idle');
        setTearProgress(0);
        tearStartX.current = null;
      }
    }
  }, [phase, tearProgress]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (phase !== 'idle' || gachaState.dailyPacks <= 0) return;
    if (!packRef.current) return;

    const touch = e.touches[0];
    const rect = packRef.current.getBoundingClientRect();
    const y = (touch.clientY - rect.top) / rect.height;

    if (y <= 0.18) {
      tearStartX.current = touch.clientX;
      setPhase('tearing');
      setTearProgress(0);
      playPackCrinkle();
    }
  }, [phase, gachaState.dailyPacks]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (phase !== 'tearing' || !packRef.current || tearStartX.current === null) return;

    const touch = e.touches[0];
    const rect = packRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (touch.clientX - tearStartX.current) / (rect.width * 0.85)));
    setTearProgress(progress);

    // Mouse pos for holo
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;
    setMousePos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });

    const now = Date.now();
    if (now - lastTearSound.current > 60 && progress > 0.05) {
      playTearProgress();
      lastTearSound.current = now;
    }

    if (progress >= 0.8) {
      completeTear();
    }
  }, [phase]);

  const handleTouchEnd = useCallback(() => {
    if (phase === 'tearing' && tearProgress < 0.8) {
      setPhase('idle');
      setTearProgress(0);
      tearStartX.current = null;
    }
  }, [phase, tearProgress]);

  const completeTear = useCallback(() => {
    setTearProgress(1);
    setPhase('torn');
    playTearComplete();
    tearStartX.current = null;

    // After a beat, transition to opening
    setTimeout(() => {
      setPhase('opening');
      playPackOpen();
    }, 400);

    // Then start loading cards
    setTimeout(() => {
      setPhase('loading');
      loadCards();
    }, 1000);
  }, []);

  const loadCards = useCallback(async () => {
    try {
      const gold = isGoldPack();
      const rarities: Rarity[] = [];
      for (let i = 0; i < 5; i++) {
        if (gold && i === 4) {
          const srPlusRarities: Rarity[] = ['SR', 'SR', 'SR', 'SSR', 'SSR', 'UR', 'LR'];
          rarities.push(srPlusRarities[Math.floor(Math.random() * srPlusRarities.length)]);
        } else {
          rarities.push(rollRarity());
        }
      }

      const rarityOrder: Record<Rarity, number> = { C: 0, UC: 1, R: 2, SR: 3, SSR: 4, UR: 5, LR: 6 };
      rarities.sort((a, b) => rarityOrder[a] - rarityOrder[b]);

      const cards = await generatePack(rarities);

      if (cards.length === 0) {
        setError('Failed to fetch cards. Please try again.');
        resetPack();
        return;
      }

      const newState = consumePack();
      if (gold) resetGoldCounter();
      addCardsToCollection(cards);

      setGachaState(newState);
      setPulledCards(cards);
      setPhase('revealing');
      onCollectionUpdate();
    } catch (err) {
      console.error('Error opening pack:', err);
      setError('Something went wrong. Please try again.');
      resetPack();
    }
  }, [gachaState, onCollectionUpdate]);

  const resetPack = () => {
    setPhase('idle');
    setTearProgress(0);
    setPulledCards(null);
    setGachaState(getGachaState());
    tearStartX.current = null;
  };

  const handleRevealComplete = () => {
    setPhase('results');
  };

  const handleBackToPacks = () => {
    resetPack();
  };

  const pullsUntilGold = 10 - gachaState.pullsSinceGold;
  const isGold = pullsUntilGold <= 0;
  const packDisabled = gachaState.dailyPacks <= 0 || !['idle', 'tearing'].includes(phase);

  // Holographic light angle based on mouse position
  const holoAngle = mousePos.x * 360;
  const holoX = mousePos.x * 100;
  const holoY = mousePos.y * 100;
  const tiltX = (mousePos.y - 0.5) * -10;
  const tiltY = (mousePos.x - 0.5) * 10;

  return (
    <>
      {/* Info modal */}
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Card reveal overlay */}
      {phase === 'revealing' && pulledCards && (
        <CardReveal cards={pulledCards} onComplete={handleRevealComplete} />
      )}

      {/* Results view */}
      <AnimatePresence>
        {phase === 'results' && pulledCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/95 flex flex-col items-center pt-20 pb-8 overflow-y-auto"
          >
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-bold text-white mb-2"
            >
              Pack Results
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-sm mb-6"
            >
              {pulledCards.filter(c => c.isNew).length} new card{pulledCards.filter(c => c.isNew).length !== 1 ? 's' : ''}
            </motion.p>

            <div className="flex flex-wrap justify-center gap-4 px-4 max-w-3xl">
              {pulledCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                >
                  <Card card={card} size="small" />
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={handleBackToPacks}
              className="mt-8 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors border border-gray-700"
            >
              Back to Packs
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
            />
            <p className="text-yellow-500 text-sm mt-4">Pulling cards...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main pack screen */}
      <div
        className="min-h-screen flex flex-col items-center pt-24 pb-8 px-4"
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
      >
        {/* Daily packs counter */}
        <motion.div
          className="border border-yellow-500/40 rounded-full px-6 py-2.5 mb-2 bg-yellow-500/5"
          animate={gachaState.dailyPacks === 0 ? { borderColor: ['rgba(234,179,8,0.3)', 'rgba(234,179,8,0.1)'] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <span className="text-sm font-mono tracking-widest text-gray-400">DAILY PACKS: </span>
          <span className={`text-sm font-mono font-bold ${gachaState.dailyPacks > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
            {gachaState.dailyPacks}
          </span>
          <span className="text-sm font-mono text-gray-400"> / {gachaState.maxPacks}</span>
        </motion.div>

        {/* Gold pack countdown + info button */}
        <div className="flex items-center gap-3 text-xs mb-8">
          <div>
            {isGold ? (
              <motion.span
                className="text-yellow-400 font-bold"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                &#9733; Next pack is GOLD! &#9733;
              </motion.span>
            ) : (
              <span className="text-yellow-700">{pullsUntilGold} pull{pullsUntilGold !== 1 ? 's' : ''} until Gold Pack</span>
            )}
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="w-6 h-6 rounded-full border border-gray-600 text-gray-500 hover:text-white hover:border-gray-400 transition-colors flex items-center justify-center text-xs font-bold shrink-0"
          >
            ?
          </button>
        </div>

        {/* ===== THE PACK ===== */}
        <div
          className="relative select-none"
          style={{
            perspective: '800px',
            opacity: packDisabled && phase === 'idle' ? 0.35 : 1,
          }}
        >
          <motion.div
            ref={packRef}
            className="pack-wrapper relative cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            style={{
              width: 240,
              height: 340,
              transformStyle: 'preserve-3d',
              transform: phase === 'idle'
                ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
                : undefined,
              transition: phase === 'idle' ? 'transform 0.1s ease-out' : undefined,
            }}
            animate={
              phase === 'opening'
                ? { scale: [1, 1.15, 0.3], opacity: [1, 1, 0], rotateX: [-5, 10, 0] }
                : phase === 'torn'
                ? { scale: 1.02 }
                : {}
            }
            transition={
              phase === 'opening'
                ? { duration: 0.8, ease: 'easeInOut' }
                : { duration: 0.2 }
            }
            whileHover={phase === 'idle' && !packDisabled ? { scale: 1.02, y: -4 } : {}}
          >
            {/* Pack ambient glow */}
            <div
              className="absolute -inset-8 rounded-3xl blur-3xl transition-opacity duration-300"
              style={{
                background: isGold
                  ? 'radial-gradient(ellipse at center, rgba(234,179,8,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(100,140,255,0.1) 0%, transparent 70%)',
                opacity: phase === 'idle' ? 1 : 0,
              }}
            />

            {/* ---- Pack body ---- */}
            <div
              className="absolute inset-0 rounded-lg overflow-hidden"
              style={{
                background: isGold
                  ? `linear-gradient(135deg, #8B6914 0%, #D4A017 20%, #FFD700 40%, #D4A017 60%, #8B6914 80%, #D4A017 100%)`
                  : `linear-gradient(135deg, #1a1f3a 0%, #2a3060 20%, #3a4080 40%, #2a3060 60%, #1a1f3a 80%, #2a3060 100%)`,
                boxShadow: isGold
                  ? '0 20px 60px rgba(212,160,23,0.3), 0 0 1px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Holographic foil overlay — shifts with mouse */}
              <div
                className="absolute inset-0 pointer-events-none pack-holo-foil"
                style={{
                  background: `
                    radial-gradient(ellipse at ${holoX}% ${holoY}%, rgba(255,255,255,0.25) 0%, transparent 50%),
                    conic-gradient(
                      from ${holoAngle}deg at ${holoX}% ${holoY}%,
                      rgba(255,0,0,0.08),
                      rgba(255,165,0,0.08),
                      rgba(255,255,0,0.08),
                      rgba(0,255,0,0.08),
                      rgba(0,100,255,0.08),
                      rgba(128,0,255,0.08),
                      rgba(255,0,128,0.08),
                      rgba(255,0,0,0.08)
                    )
                  `,
                  mixBlendMode: 'overlay',
                }}
              />

              {/* Foil sparkle pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                  backgroundImage: `
                    radial-gradient(1px 1px at 20% 30%, white, transparent),
                    radial-gradient(1px 1px at 40% 70%, white, transparent),
                    radial-gradient(1px 1px at 60% 20%, white, transparent),
                    radial-gradient(1px 1px at 80% 50%, white, transparent),
                    radial-gradient(1px 1px at 10% 80%, white, transparent),
                    radial-gradient(1px 1px at 70% 90%, white, transparent),
                    radial-gradient(1px 1px at 30% 50%, white, transparent),
                    radial-gradient(1px 1px at 90% 10%, white, transparent),
                    radial-gradient(1px 1px at 50% 40%, white, transparent)
                  `,
                  backgroundSize: '100% 100%',
                }}
              />

              {/* Light sweep that follows mouse */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                style={{
                  background: `linear-gradient(${105 + (mousePos.x - 0.5) * 30}deg, transparent 30%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 70%)`,
                  opacity: phase === 'idle' ? 1 : 0,
                }}
              />

              {/* Seal line at top */}
              <div className="absolute top-[14%] left-0 right-0 h-[2px]" style={{
                background: isGold
                  ? 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), rgba(255,255,255,0.6), rgba(255,215,0,0.4), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(255,255,255,0.3), rgba(255,255,255,0.15), transparent)',
              }} />

              {/* Serrated edge */}
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{
                  background: isGold
                    ? 'linear-gradient(180deg, #D4A017, #8B6914)'
                    : 'linear-gradient(180deg, #2a3060, #1a1f3a)',
                  clipPath: 'polygon(0 0, 3% 100%, 6% 0, 9% 100%, 12% 0, 15% 100%, 18% 0, 21% 100%, 24% 0, 27% 100%, 30% 0, 33% 100%, 36% 0, 39% 100%, 42% 0, 45% 100%, 48% 0, 51% 100%, 54% 0, 57% 100%, 60% 0, 63% 100%, 66% 0, 69% 100%, 72% 0, 75% 100%, 78% 0, 81% 100%, 84% 0, 87% 100%, 90% 0, 93% 100%, 96% 0, 100% 100%, 100% 0)',
                }}
              />

              {/* Tear line indicator — glows when hovering near top */}
              {phase === 'idle' && !packDisabled && (
                <div
                  className="absolute left-0 right-0 h-6 top-0 z-10 transition-opacity duration-200"
                  style={{
                    opacity: mousePos.y < 0.2 ? 0.8 : 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                  }}
                />
              )}

              {/* Active tear line */}
              {phase === 'tearing' && (
                <div className="absolute top-[13%] left-0 right-0 h-[4px] z-20">
                  <div
                    className="h-full"
                    style={{
                      width: `${tearProgress * 100}%`,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,220,100,1))',
                      boxShadow: '0 0 12px rgba(255,220,100,0.8), 0 0 30px rgba(255,220,100,0.4)',
                      transition: 'width 0.03s linear',
                    }}
                  />
                </div>
              )}

              {/* Torn state — gap reveals light inside */}
              {(phase === 'torn' || phase === 'opening') && (
                <motion.div
                  className="absolute top-[10%] left-0 right-0 z-20 overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 20, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,240,180,0.9) 0%, rgba(255,200,50,0.6) 50%, rgba(255,240,180,0.3) 100%)',
                      boxShadow: '0 0 40px rgba(255,200,50,0.8)',
                    }}
                  />
                </motion.div>
              )}

              {/* Pack branding content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
                {/* Large W logo */}
                <div
                  className="text-[90px] font-serif font-bold leading-none mb-2 select-none"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: isGold ? '1.5px rgba(255,215,0,0.3)' : '1.5px rgba(255,255,255,0.12)',
                  }}
                >
                  W
                </div>

                {/* Title */}
                <div
                  className="text-xl font-bold tracking-widest select-none"
                  style={{
                    color: isGold ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.35)',
                    textShadow: isGold ? '0 0 20px rgba(255,215,0,0.3)' : 'none',
                  }}
                >
                  WikiPull
                </div>
                <div
                  className="text-[10px] tracking-[0.2em] mt-1 select-none"
                  style={{ color: isGold ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.2)' }}
                >
                  THE ENCYCLOPEDIA TCG
                </div>

                {/* Divider */}
                <div
                  className="w-16 h-px mt-4"
                  style={{ background: isGold ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)' }}
                />
                <div
                  className="text-[10px] mt-2 font-mono select-none"
                  style={{ color: isGold ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.2)' }}
                >
                  5 CARDS
                </div>
              </div>

              {/* Gold pack shimmer overlay */}
              {isGold && phase === 'idle' && (
                <div className="absolute inset-0 pointer-events-none pack-gold-shimmer" />
              )}

              {/* Edge highlight */}
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  border: isGold
                    ? '1px solid rgba(255,215,0,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Instruction text */}
        <motion.div
          className="mt-10 text-sm tracking-wider select-none text-center"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {phase === 'loading' ? (
            <span className="text-yellow-500">Pulling cards...</span>
          ) : phase === 'tearing' ? (
            <span className="text-yellow-400">Keep swiping...</span>
          ) : gachaState.dailyPacks > 0 ? (
            <span className="text-gray-500">Swipe across the top to open</span>
          ) : (
            <span className="text-gray-600">No packs available</span>
          )}
        </motion.div>

        {error && (
          <div className="mt-4 text-red-400 text-sm">{error}</div>
        )}

        {gachaState.dailyPacks < gachaState.maxPacks && gachaState.dailyPacks > 0 && (
          <div className="mt-3 text-gray-700 text-xs">
            Packs regenerate every minute
          </div>
        )}
      </div>
    </>
  );
}
