"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";

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

// Client-side cache for instant search results
interface CacheEntry {
  results: SearchSuggestion[];
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Limit cache to 50 entries

function getCachedResults(query: string): SearchSuggestion[] | null {
  const normalizedQuery = query.trim().toLowerCase();
  const entry = searchCache.get(normalizedQuery);
  
  if (!entry) return null;
  
  // Check if cache is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    searchCache.delete(normalizedQuery);
    return null;
  }
  
  return entry.results;
}

function setCachedResults(query: string, results: SearchSuggestion[]) {
  const normalizedQuery = query.trim().toLowerCase();
  
  // Limit cache size by removing oldest entries
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(searchCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    searchCache.delete(oldestKey);
  }
  
  searchCache.set(normalizedQuery, {
    results,
    timestamp: Date.now()
  });
}

export default function SearchDropdown({ 
  placeholder = "搜尋最抵Deal",
  className = "",
  onClose
}: SearchDropdownProps) {
  const router = useRouter();
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

  // Score suggestions for better matching (name starts with query gets higher priority)
  const getMatchScore = useCallback((name: string, website: string | undefined, query: string): number => {
    const nameLower = name.toLowerCase();
    const q = query.toLowerCase();
    
    if (nameLower.startsWith(q)) return 100;
    if (nameLower.includes(q)) return 50;
    if (website?.toLowerCase().includes(q)) return 25;
    return 0;
  }, []);

  // Memoize processed suggestions for better performance
  const processedSuggestions = useMemo(() => {
    if (!suggestions.length) return [];
    
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      isSelected: index === selectedIndex,
    }));
  }, [suggestions, selectedIndex]);

  // Prefetch popular search queries on mount
  useEffect(() => {
    const popularQueries = ['a', 'b', 'c', 't', 'k', 'f', 'p', 's']; // Popular starting letters
    
    const prefetchPopularSearches = async () => {
      const { searchAction } = await import('@/lib/search-actions');
      const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
      
      // Prefetch in background without blocking
      Promise.all(
        popularQueries.map(async (q) => {
          try {
            const data = await searchAction(q, market);
            if (!data.error && (data.merchants.length > 0 || data.coupons.length > 0)) {
              const merchants = (data.merchants || []).slice(0, 5);
              const coupons = (data.coupons || []).slice(0, 5);
              
              const scoredMerchants = merchants.map((m: any) => ({
                id: m.id,
                name: m.name,
                slug: m.slug,
                logo: m.logo,
                website: m.website || '',
                type: 'merchant' as const,
                score: getMatchScore(m.name, m.website, q)
              }));

              const scoredCoupons = coupons.map((c: any) => ({
                id: c.id,
                name: c.title,
                slug: c.merchant?.slug,
                logo: c.merchant?.logo,
                website: c.merchant?.name || '',
                type: 'coupon' as const,
                score: getMatchScore(c.title, c.merchant?.name, q)
              }));

              const allResults = [...scoredMerchants, ...scoredCoupons]
                .sort((a, b) => {
                  if (a.score === b.score) {
                    return a.type === 'merchant' ? -1 : 1;
                  }
                  return b.score - a.score;
                })
                .slice(0, 5)
                .map(({ score, ...rest }) => rest);
              
              setCachedResults(q, allResults);
            }
          } catch (error) {
            // Silently fail prefetch
          }
        })
      );
    };

    prefetchPopularSearches();
  }, [getMatchScore]);

  // Debounced search function with request cancellation and caching
  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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

    // Check cache first for instant results
    const cachedResults = getCachedResults(query);
    if (cachedResults && cachedResults.length > 0) {
      // Show cached results immediately
      startTransition(() => {
        setSuggestions(cachedResults);
        setIsLoading(false);
        setShowDropdown(true);
      });
      
      // Still fetch fresh data in background
      setIsLoading(true);
    } else {
      // Set loading state
      setIsLoading(true);
      setShowDropdown(true);
    }

    setError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Debounce API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Use Server Action for better error handling and server-side processing
        const { searchAction } = await import('@/lib/search-actions');
        const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
        
        const data = await searchAction(query.trim(), market);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Handle error from server action
        if (data.error) {
          throw new Error(data.error);
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

        // Cache the results
        setCachedResults(query.trim(), allResults);

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
    }, 150); // Reduced to 150ms for faster response

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, getMatchScore, startTransition]);

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

