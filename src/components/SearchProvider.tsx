"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface MerchantSearchData {
  id: string | number;
  name: string;
  slug: string;
  logo: string;
  website: string;
}

interface HotstoreMerchant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface SearchContextType {
  merchants: MerchantSearchData[];
  isLoading: boolean;
  hotstoreMerchants: HotstoreMerchant[];
}

const SearchContext = createContext<SearchContextType>({
  merchants: [],
  isLoading: false,
  hotstoreMerchants: [],
});

interface SearchProviderProps {
  children: React.ReactNode;
  hotstoreMerchants?: HotstoreMerchant[]; // Hotstore merchants fetched server-side
  marketKey: string; // 'hk' | 'tw'
}

export function SearchProvider({ children, hotstoreMerchants = [], marketKey }: SearchProviderProps) {
  const [merchants, setMerchants] = useState<MerchantSearchData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const storageKey = useMemo(() => `dealy:search-index:${marketKey.toLowerCase()}`, [marketKey]);

  useEffect(() => {
    let cancelled = false;

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { ts: number; merchants: MerchantSearchData[] } | null;
        if (!parsed?.ts || !Array.isArray(parsed?.merchants)) return null;

        const ageMs = Date.now() - parsed.ts;
        const ttlMs = 7 * 24 * 60 * 60 * 1000;
        if (ageMs > ttlMs) return null;
        return parsed.merchants;
      } catch {
        return null;
      }
    };

    const saveToStorage = (data: MerchantSearchData[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), merchants: data }));
      } catch {
        // ignore storage quota / disabled
      }
    };

    async function run() {
      const cached = loadFromStorage();
      if (cached && !cancelled) {
        setMerchants(cached);
        setIsLoading(false);
      }

      // Always fetch in background if we have no data yet.
      if (cached && cached.length > 0) return;

      setIsLoading(true);
      try {
        const res = await fetch('/api/search-index', { method: 'GET' });
        if (!res.ok) throw new Error(`search-index ${res.status}`);
        const json = (await res.json()) as { merchants?: MerchantSearchData[] };
        const next = Array.isArray(json?.merchants) ? json.merchants : [];
        if (!cancelled) {
          setMerchants(next);
          setIsLoading(false);
          saveToStorage(next);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  return (
    <SearchContext.Provider value={{ merchants, isLoading, hotstoreMerchants }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchMerchants() {
  return useContext(SearchContext);
}

