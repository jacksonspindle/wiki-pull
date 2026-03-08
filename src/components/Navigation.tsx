'use client';

import { motion } from 'framer-motion';

interface NavigationProps {
  activeTab: 'gacha' | 'collection';
  onTabChange: (tab: 'gacha' | 'collection') => void;
  stardust: number;
}

export default function Navigation({ activeTab, onTabChange, stardust }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold text-white tracking-tight">Wiki</span>
          <span className="text-xl font-bold text-yellow-500 tracking-tight">Pull</span>
        </div>

        <div className="flex items-center gap-6">
          {(['gacha', 'collection'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="relative px-2 py-1"
            >
              <span className={`text-sm font-semibold capitalize transition-colors ${
                activeTab === tab ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-200'
              }`}>
                {tab}
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-3 left-0 right-0 h-0.5 bg-yellow-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-xs">&#10022;</span>
          <span className="text-sm font-mono text-yellow-400">{stardust.toLocaleString()}</span>
        </div>
      </div>
    </nav>
  );
}
