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
  isLoading: false, // Changed to false since we're getting data from server
});

interface SearchProviderProps {
  children: React.ReactNode;
  initialMerchants?: MerchantSearchData[]; // Merchants fetched server-side
}

export function SearchProvider({ children, initialMerchants = [] }: SearchProviderProps) {
  const [merchants, setMerchants] = useState<MerchantSearchData[]>(initialMerchants);
  const [isLoading, setIsLoading] = useState(false); // No loading needed since data comes from server

  // Use initial merchants from server
  useEffect(() => {
    console.log(`[SearchProvider] Received initialMerchants:`, {
      length: initialMerchants.length,
      sample: initialMerchants.slice(0, 3).map(m => ({ id: m.id, name: m.name, slug: m.slug }))
    });
    
    if (initialMerchants.length > 0) {
      setMerchants(initialMerchants);
      console.log(`✅ Loaded ${initialMerchants.length} merchants from server for instant search`);
      
      // Debug: Log sample merchants
      console.log('Sample merchants:', initialMerchants.slice(0, 5).map(m => ({
        name: m.name,
        slug: m.slug,
        website: m.website
      })));
    } else {
      console.warn(`⚠️ [SearchProvider] No merchants received from server! initialMerchants.length = ${initialMerchants.length}`);
    }
  }, [initialMerchants]);

  return (
    <SearchContext.Provider value={{ merchants, isLoading }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchMerchants() {
  return useContext(SearchContext);
}

