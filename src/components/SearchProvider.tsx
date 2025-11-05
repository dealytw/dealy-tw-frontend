"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface MerchantSearchData {
  id: string | number;
  name: string;
  slug: string;
  logo: string;
  website: string;
}

interface SearchContextType {
  merchants: MerchantSearchData[];
  isLoading: boolean;
}

const SearchContext = createContext<SearchContextType>({
  merchants: [],
  isLoading: true,
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [merchants, setMerchants] = useState<MerchantSearchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Defer prefetch to not block initial page load
    // Use requestIdleCallback for low-priority background fetch
    // Falls back to setTimeout if requestIdleCallback is not available
    const prefetchMerchants = async () => {
      try {
        console.log('🚀 Starting merchant prefetch...');
        const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
        
        // Use API route instead of Server Action for better error handling
        const response = await fetch(`/api/merchants-all?market=${market}`, {
          cache: 'force-cache', // Use cached data if available
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Fetch failed: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const merchants = data.merchants || [];
        
        if (merchants.length === 0) {
          console.warn('⚠️ No merchants fetched! Check API connection.');
        } else {
          setMerchants(merchants);
          console.log(`✅ Prefetched ${merchants.length} merchants for instant search`);
          
          // Debug: Log sample merchants
          console.log('Sample merchants:', merchants.slice(0, 5).map(m => ({
            name: m.name,
            slug: m.slug,
            website: m.website
          })));
        }
      } catch (error: any) {
        console.error('❌ Failed to prefetch merchants:', error);
        console.error('Error details:', error.message, error.stack);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer until browser is idle (after initial render)
    // Reduced timeout to start prefetch sooner (500ms instead of 1000-2000ms)
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(prefetchMerchants, { timeout: 500 }); // Wait max 500ms
    } else {
      // Fallback: delay by 500ms to let page render first
      setTimeout(prefetchMerchants, 500);
    }
  }, []);

  return (
    <SearchContext.Provider value={{ merchants, isLoading }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchMerchants() {
  return useContext(SearchContext);
}

