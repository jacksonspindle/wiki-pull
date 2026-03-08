'use client';

import { useState, useCallback, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PackScreen from '@/components/PackScreen';
import CollectionView from '@/components/Collection';
import { getCollection } from '@/lib/storage';
import { Collection } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'gacha' | 'collection'>('gacha');
  const [collection, setCollection] = useState<Collection>({
    cards: [],
    totalPulls: 0,
    packsOpened: 0,
    stardust: 0,
  });

  useEffect(() => {
    setCollection(getCollection());
  }, []);

  const refreshCollection = useCallback(() => {
    setCollection(getCollection());
  }, []);

  return (
    <main className="min-h-screen bg-gray-950">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stardust={collection.stardust}
      />

      {activeTab === 'gacha' ? (
        <PackScreen onCollectionUpdate={refreshCollection} />
      ) : (
        <CollectionView collection={collection} onUpdate={refreshCollection} />
      )}
    </main>
  );
}
