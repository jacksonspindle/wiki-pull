'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';

export type Tab = 'gacha' | 'collection' | 'binders';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  stardust: number;
}

export default function Navigation({ activeTab, onTabChange, stardust }: NavigationProps) {
  const { signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold text-white tracking-tight">Wiki</span>
          <span className="text-xl font-bold text-yellow-500 tracking-tight">Pull</span>
        </div>

        <div className="flex items-center gap-5">
          {(['gacha', 'collection', 'binders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="relative px-1 py-1"
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-xs">&#10022;</span>
            <span className="text-sm font-mono text-yellow-400">{stardust.toLocaleString()}</span>
          </div>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            title="Sign out"
          >
            &#x2192;
          </button>
        </div>
      </div>
    </nav>
  );
}
