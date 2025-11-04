"use client";

import { useState, useEffect, useRef } from "react";
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

export default function SearchDropdown({ 
  placeholder = "搜尋最抵Deal",
  className = "",
  onClose
}: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Score suggestions for better matching (name starts with query gets higher priority)
  const getMatchScore = (name: string, website: string | undefined, query: string): number => {
    const nameLower = name.toLowerCase();
    const q = query.toLowerCase();
    
    if (nameLower.startsWith(q)) return 100;
    if (nameLower.includes(q)) return 50;
    if (website?.toLowerCase().includes(q)) return 25;
    return 0;
  };

  // Debounced search function
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
      return;
    }

    // Set loading state
    setIsLoading(true);
    setShowDropdown(true);

    // Debounce API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await response.json();

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

        setSuggestions(allResults);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

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
          // Submit search form
          handleSearchSubmit(e);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setQuery("");
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
      if (onClose) onClose();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'merchant' && suggestion.slug) {
      router.push(`/shop/${suggestion.slug}`);
    } else if (suggestion.type === 'coupon' && suggestion.slug) {
      router.push(`/shop/${suggestion.slug}`);
    } else {
      // Fallback to search page
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setShowDropdown(false);
    setQuery("");
    if (onClose) onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              搜尋中...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <Link
                  key={`${suggestion.type}-${suggestion.id}`}
                  href={suggestion.type === 'merchant' && suggestion.slug 
                    ? `/shop/${suggestion.slug}` 
                    : `/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Logo */}
                  <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                    {suggestion.logo ? (
                      <Image
                        src={suggestion.logo}
                        alt={suggestion.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                        sizes="40px"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
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
            <div className="p-4 text-center text-gray-500 text-sm">
              找不到相關結果
            </div>
          )}
        </div>
      )}
    </div>
  );
}

