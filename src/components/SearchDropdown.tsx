"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useSearchMerchants } from "./SearchProvider";

interface SearchSuggestion {
  id: string | number;
  name: string;
  slug?: string;
  logo?: string;
  website?: string;
  type: 'merchant' | 'coupon';
}

interface SearchDropdownProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
}

// Global cache for all merchants (set once on page load)
let globalMerchantsCache: Array<{
  id: string | number;
  name: string;
  slug: string;
  logo: string;
  website: string;
}> = [];

// Score suggestions for better matching
function getMatchScore(name: string, website: string | undefined, query: string): number {
  const nameLower = name.toLowerCase();
  const q = query.toLowerCase();
  
  if (nameLower.startsWith(q)) return 100;
  if (nameLower.includes(q)) return 50;
  if (website?.toLowerCase().includes(q)) return 25;
  return 0;
}

// Filter and score merchants instantly from cache
function filterMerchantsFromCache(query: string): SearchSuggestion[] {
  if (!query.trim() || globalMerchantsCache.length === 0) {
    return [];
  }

  const q = query.trim().toLowerCase();
  
  const scored = globalMerchantsCache
    .map((merchant) => {
      const name = merchant.name?.toLowerCase() || '';
      const slug = merchant.slug?.toLowerCase() || '';
      const website = merchant.website?.toLowerCase() || '';
      
      const matches = name.includes(q) || slug.includes(q) || website.includes(q);
      
      if (!matches) return null;
      
      return {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        logo: merchant.logo,
        website: merchant.website,
        type: 'merchant' as const,
        score: getMatchScore(merchant.name, merchant.website, q)
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.score === a.score) {
        return a.name.localeCompare(b.name);
      }
      return b.score - a.score;
    })
    .slice(0, 5)
    .map(({ score, ...rest }) => rest);

  return scored;
}

export default function SearchDropdown({ 
  placeholder = "搜尋最抵Deal",
  className = "",
  onClose
}: SearchDropdownProps) {
  const router = useRouter();
  const { merchants: prefetchedMerchants, isLoading: merchantsLoading } = useSearchMerchants();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize global cache with prefetched merchants from context (non-blocking)
  useEffect(() => {
    if (prefetchedMerchants.length > 0 && globalMerchantsCache.length === 0) {
      globalMerchantsCache = prefetchedMerchants;
      console.log(`✅ Loaded ${globalMerchantsCache.length} merchants into search cache`);
    }
  }, [prefetchedMerchants]);

  // Memoize processed suggestions for better performance
  const processedSuggestions = useMemo(() => {
    if (!suggestions.length) return [];
    
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      isSelected: index === selectedIndex,
    }));
  }, [suggestions, selectedIndex]);

  // Trigger prefetch when user focuses on search input
  useEffect(() => {
    const handleFocus = () => {
      // If cache is empty but merchants are loaded, populate cache
      if (globalMerchantsCache.length === 0 && prefetchedMerchants.length > 0) {
        globalMerchantsCache = prefetchedMerchants;
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      return () => input.removeEventListener('focus', handleFocus);
    }
  }, [prefetchedMerchants]);

  // Instant search using cached merchants (no debounce needed!)
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, clear suggestions
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // INSTANT SEARCH: Filter from cache immediately (no debounce!)
    const cachedResults = filterMerchantsFromCache(query);
    
    if (cachedResults.length > 0) {
      // Show cached results instantly
      startTransition(() => {
        setSuggestions(cachedResults);
        setIsLoading(false);
        setShowDropdown(true);
      });
      
      // No need to fetch - we have instant results!
      return;
    }

    // If no cached results, show loading and fetch (fallback)
    setIsLoading(true);
    setShowDropdown(true);
    setError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Debounce API call only if cache is empty
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
        
        console.log('🔍 Cache miss - fetching from API:', query.trim());
        
        // Fallback to API route if cache is empty
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&market=${market}`, {
          signal: abortControllerRef.current?.signal,
        });
        
        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          console.error('❌ API Error:', response.status, errorText);
          throw new Error(`Search failed: ${response.status} ${errorText.slice(0, 100)}`);
        }
        
        const data = await response.json();

        // Check if request was aborted after data fetch
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Handle error from API response
        if (data.error) {
          console.error('❌ Search error:', data.error);
          throw new Error(data.error);
        }

        // Ensure we have valid data structure
        if (!data || (!data.merchants && !data.coupons)) {
          console.warn('⚠️ Invalid API response:', data);
          // Don't throw error, just show empty results
          startTransition(() => {
            setSuggestions([]);
            setIsLoading(false);
          });
          return;
        }

        // Combine merchants and coupons, prioritize merchants and best matches
        const merchants = (data.merchants || []).slice(0, 5);
        const coupons = (data.coupons || []).slice(0, 5);
        
        // Score and sort merchants
        const scoredMerchants = merchants.map((m: any) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          logo: m.logo,
          website: m.website || m.affiliateLink || '',
          type: 'merchant' as const,
          score: getMatchScore(m.name, m.website, query.trim())
        }));

        // Score and sort coupons
        const scoredCoupons = coupons.map((c: any) => ({
          id: c.id,
          name: c.title,
          slug: c.merchant?.slug,
          logo: c.merchant?.logo,
          website: c.merchant?.name || '',
          type: 'coupon' as const,
          score: getMatchScore(c.title, c.merchant?.name, query.trim())
        }));

        // Combine and sort by score, prioritize merchants
        const allResults = [...scoredMerchants, ...scoredCoupons]
          .sort((a, b) => {
            // Merchants first if same score
            if (a.score === b.score) {
              return a.type === 'merchant' ? -1 : 1;
            }
            return b.score - a.score;
          })
          .slice(0, 5) // Top 5
          .map(({ score, ...rest }) => rest); // Remove score before setting state

        // Use startTransition for non-urgent state updates
        startTransition(() => {
          setSuggestions(allResults);
          setIsLoading(false);
        });
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === 'AbortError') {
          return;
        }
        
        console.error('Search error:', error);
        setError('搜尋時發生錯誤，請稍後再試');
        setSuggestions([]);
        setIsLoading(false);
      }
    }, 300); // Only debounce if cache miss

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleSearchSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearchSubmit(e);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setQuery("");
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, suggestions, selectedIndex, query]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
      if (onClose) onClose();
    }
  }, [query, router, onClose]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'merchant' && suggestion.slug) {
      router.push(`/shop/${suggestion.slug}`);
    } else if (suggestion.type === 'coupon' && suggestion.slug) {
      router.push(`/shop/${suggestion.slug}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setShowDropdown(false);
    setQuery("");
    setSelectedIndex(-1);
    if (onClose) onClose();
  }, [query, router, onClose]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          aria-label="Search for merchants and coupons"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && query.trim() && (
        <div
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {isLoading || isPending ? (
            <div className="p-4 text-center text-gray-500 text-sm" role="status" aria-live="polite">
              搜尋中...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 text-sm" role="alert" aria-live="assertive">
              {error}
            </div>
          ) : processedSuggestions.length > 0 ? (
            <div className="py-2">
              {processedSuggestions.map((suggestion, index) => (
                <Link
                  key={`${suggestion.type}-${suggestion.id}`}
                  href={suggestion.type === 'merchant' && suggestion.slug 
                    ? `/shop/${suggestion.slug}` 
                    : `/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    suggestion.isSelected ? 'bg-gray-50' : ''
                  }`}
                  role="option"
                  aria-selected={suggestion.isSelected}
                >
                  {/* Logo */}
                  <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                    {suggestion.logo ? (
                      <Image
                        src={suggestion.logo}
                        alt={`${suggestion.name} logo`}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                        sizes="40px"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs text-gray-400" aria-hidden="true">
                        {suggestion.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-blue-600 truncate">
                      {suggestion.name}
                    </div>
                    {suggestion.website && (
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.website}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm" role="status" aria-live="polite">
              找不到相關結果
            </div>
          )}
        </div>
      )}
    </div>
  );
}

