"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { getDomainConfig } from "@/lib/domain-config.client";

interface LanguageOption {
  code: string;
  label: string;
  domain: string;
  hreflang: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "tw",
    label: "繁體中文(台灣)",
    domain: "dealy.tw",
    hreflang: "zh-TW",
  },
  {
    code: "hk",
    label: "繁體中文(香港)",
    domain: "dealy.hk",
    hreflang: "zh-HK",
  },
];

/**
 * Extract URL from Strapi rich text field (hreflang_alternate) - Client-side version
 * Handles string, link blocks, and paragraph blocks with links
 */
function extractUrlFromRichText(richText: any): string | null {
  if (!richText) return null;
  
  // If it's already a string URL, return it
  if (typeof richText === 'string') {
    // Check if it's a valid URL
    if (richText.startsWith('http://') || richText.startsWith('https://')) {
      return richText.trim();
    }
    return null;
  }
  
  // If it's an array of blocks (Strapi rich text format)
  if (Array.isArray(richText)) {
    for (const block of richText) {
      // Check for link block
      if (block.type === 'link' && block.url) {
        return block.url;
      }
      
      // Check for paragraph with link
      if (block.type === 'paragraph' && block.children) {
        for (const child of block.children) {
          if (child.type === 'link' && child.url) {
            return child.url;
          }
          // Also check nested children
          if (child.children) {
            for (const nested of child.children) {
              if (nested.type === 'link' && nested.url) {
                return nested.url;
              }
            }
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Fetch merchant hreflang_alternate URL from API route
 */
async function fetchMerchantAlternateUrl(merchantSlug: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/merchant-alternate-url?slug=${encodeURIComponent(merchantSlug)}`, {
      cache: 'force-cache', // Cache for better performance
    });

    if (!response.ok) {
      console.warn(`[LanguageSwitcher] Failed to fetch merchant alternate URL: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.alternateUrl || null;
  } catch (error) {
    console.warn('[LanguageSwitcher] Error fetching merchant alternate URL:', error);
    return null;
  }
}

/**
 * Maps current path to equivalent alternate domain path
 * Uses hreflang_alternate field for merchant pages if available
 */
function mapPathToAlternateDomain(currentPath: string, targetDomain: string): string {
  // Main pages that exist on both domains
  const mainPages: Record<string, string> = {
    "/": "/",
    "/shop": "/shop",
    "/special-offers": "/special-offers",
    "/blog": "/blog",
  };

  // If it's a main page, keep the same path
  if (mainPages[currentPath]) {
    return mainPages[currentPath];
  }

  // For merchant/coupon pages, fallback to homepage
  // (The actual alternate URL will be fetched from merchant data)
  return "/";
}

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [alternateUrl, setAlternateUrl] = useState<string | null>(null);
  const [isLoadingAlternateUrl, setIsLoadingAlternateUrl] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const domainConfig = getDomainConfig();
  const currentLanguage = LANGUAGES.find((lang) => lang.domain === domainConfig.domain) || LANGUAGES[0];

  // Check if we're on a merchant page and fetch alternate URL
  useEffect(() => {
    const isMerchantPage = pathname.startsWith('/shop/') && pathname !== '/shop';
    if (isMerchantPage) {
      const merchantSlug = pathname.replace('/shop/', '');
      setIsLoadingAlternateUrl(true);
      fetchMerchantAlternateUrl(merchantSlug)
        .then((url) => {
          console.log(`[LanguageSwitcher] Fetched alternate URL for ${merchantSlug}:`, url);
          setAlternateUrl(url);
          setIsLoadingAlternateUrl(false);
        })
        .catch((error) => {
          console.warn('[LanguageSwitcher] Failed to fetch alternate URL:', error);
          setAlternateUrl(null);
          setIsLoadingAlternateUrl(false);
        });
    } else {
      setAlternateUrl(null);
    }
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Get the URL for a language option
  const getLanguageUrl = (language: LanguageOption): string => {
    if (language.code === currentLanguage.code) {
      return '#';
    }

    // For merchant pages, use alternate URL from CMS if available
    const isMerchantPage = pathname.startsWith('/shop/') && pathname !== '/shop';
    if (isMerchantPage && alternateUrl) {
      // Check if alternateUrl matches the target domain (for switching to alternate language)
      try {
        const urlObj = new URL(alternateUrl);
        // If we're switching to the alternate language and have an alternate URL, use it
        // The alternate URL should be for the other domain (e.g., if on TW, alternate is HK)
        if (urlObj.hostname === language.domain || urlObj.hostname.endsWith('.' + language.domain)) {
          console.log(`[LanguageSwitcher] Using alternate URL for ${language.code}: ${alternateUrl}`);
          return alternateUrl;
        } else {
          console.log(`[LanguageSwitcher] Alternate URL domain mismatch: ${urlObj.hostname} vs ${language.domain}`);
        }
      } catch (error) {
        console.warn('[LanguageSwitcher] Invalid alternate URL:', alternateUrl, error);
        // Invalid URL, fall through to default mapping
      }
    } else if (isMerchantPage && !alternateUrl) {
      console.log(`[LanguageSwitcher] No alternate URL found for merchant page, using fallback`);
    }

    // Map current path to alternate domain path (fallback for main pages or when no alternate URL)
    const alternatePath = mapPathToAlternateDomain(pathname, language.domain);
    const fallbackUrl = `https://${language.domain}${alternatePath}`;
    console.log(`[LanguageSwitcher] Using fallback URL for ${language.code}: ${fallbackUrl}`);
    return fallbackUrl;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-primary transition-colors rounded-md hover:bg-gray-50"
        aria-label="Switch language"
        aria-expanded={isOpen}
      >
        <span>{currentLanguage.label}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {LANGUAGES.map((language) => {
            const languageUrl = getLanguageUrl(language);
            const isCurrent = language.code === currentLanguage.code;
            
            if (isCurrent) {
              return (
                <div
                  key={language.code}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    "bg-primary/10 text-primary font-medium"
                  }`}
                >
                  {language.label}
                </div>
              );
            }
            
            return (
              <a
                key={language.code}
                href={languageUrl}
                className="w-full text-left px-4 py-2 text-sm block text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {language.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

