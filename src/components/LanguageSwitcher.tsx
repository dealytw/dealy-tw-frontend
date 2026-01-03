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
 * Extract URL from Strapi rich text field (hreflang_alternate) - DEPRECATED
 * This function is kept for backward compatibility only.
 * The new hreflang_alternate_url field is plain text (comma-separated URLs), so this function is no longer needed.
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
 * Parse comma-separated URLs from hreflang_alternate_url field
 * Returns array of valid URLs (trimmed and filtered)
 */
function parseHreflangUrls(urlString: string | null | undefined): string[] {
  if (!urlString || typeof urlString !== 'string') {
    return [];
  }
  
  return urlString
    .split(',')
    .map(url => url.trim())
    .filter(url => {
      // Only keep valid URLs
      return url.startsWith('http://') || url.startsWith('https://');
    });
}

/**
 * Maps current path to equivalent alternate domain path
 * Uses hreflang_alternate_url field for merchant, category, special offer, and legal pages if available (comma-separated URLs)
 */
function mapPathToAlternateDomain(currentPath: string, targetDomain: string): string {
  // Main pages that exist on both domains
  const mainPages: Record<string, string> = {
    "/": "/",
    "/shop": "/shop",
    "/category": "/category",
    "/special-offers": "/special-offers",
    "/blog": "/blog",
  };

  // If it's a main page, keep the same path
  if (mainPages[currentPath]) {
    return mainPages[currentPath];
  }

  // For pages with same slugs (category, special offer detail, legal), use same path
  // Category pages: /category/[slug]
  if (currentPath.startsWith('/category/')) {
    return currentPath;
  }
  
  // Special offer detail pages: /special-offers/[slug]
  if (currentPath.startsWith('/special-offers/')) {
    return currentPath;
  }
  
  // Legal pages: /[slug] (root level, one level deep)
  if (!currentPath.startsWith('/shop') && 
      !currentPath.startsWith('/category') && 
      !currentPath.startsWith('/blog') && 
      !currentPath.startsWith('/special-offers') &&
      !currentPath.startsWith('/search') &&
      !currentPath.startsWith('/submit-coupons') &&
      !currentPath.startsWith('/api') &&
      currentPath !== '/' &&
      currentPath.split('/').length === 2) {
    return currentPath;
  }

  // For merchant pages or unknown pages, fallback to homepage
  // (The actual alternate URL should be fetched from CMS data)
  return "/";
}

interface LanguageSwitcherProps {
  alternateUrl?: string | null;
}

export function LanguageSwitcher({ alternateUrl: propAlternateUrl }: LanguageSwitcherProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const domainConfig = getDomainConfig();
  const currentLanguage = LANGUAGES.find((lang) => lang.domain === domainConfig.domain) || LANGUAGES[0];

  // Use alternate URL from props (passed from merchant page) or null
  const alternateUrl = propAlternateUrl || null;

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

    // For pages with alternate URLs from CMS (merchant, category, special offer, legal)
    // Check if alternateUrl matches the target domain
    if (alternateUrl) {
      const alternateUrls = parseHreflangUrls(alternateUrl);
      
      // Find the URL that matches the target language domain
      for (const url of alternateUrls) {
        try {
          const urlObj = new URL(url);
          // Check if this URL matches the target language domain
          if (urlObj.hostname === language.domain || urlObj.hostname.endsWith('.' + language.domain)) {
            return url;
          }
        } catch {
          // Invalid URL, skip it
          continue;
        }
      }
    }

    // Fallback: Map current path to alternate domain path
    // This works for main pages and pages with same slugs (category, special offer, legal)
    const alternatePath = mapPathToAlternateDomain(pathname, language.domain);
    return `https://${language.domain}${alternatePath}`;
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

