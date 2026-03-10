'use client';

import { useState, useCallback, useEffect } from 'react';
import Navigation, { Tab } from '@/components/Navigation';
import PackScreen from '@/components/PackScreen';
import CollectionView from '@/components/Collection';
import Binders from '@/components/Binders';
import AuthScreen from '@/components/AuthScreen';
import { useAuth } from '@/lib/auth';
import { getCollection, loadCollectionFromServer } from '@/lib/storage';
import { Collection } from '@/types';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('gacha');
  const [collection, setCollection] = useState<Collection>({
    cards: [],
    totalPulls: 0,
    packsOpened: 0,
    stardust: 0,
  });

  useEffect(() => {
    if (user) {
      loadCollectionFromServer().then(setCollection);
    }
  }, [user]);

  const refreshCollection = useCallback(() => {
    setCollection(getCollection());
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stardust={collection.stardust}
      />

      {activeTab === 'gacha' ? (
        <PackScreen onCollectionUpdate={refreshCollection} />
      ) : activeTab === 'collection' ? (
        <CollectionView collection={collection} onUpdate={refreshCollection} />
      ) : (
        <Binders collection={collection} />
      )}
    </main>
  );
}
