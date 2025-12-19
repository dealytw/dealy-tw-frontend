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

    // For merchant pages, use alternate URL from props if available
    const isMerchantPage = pathname.startsWith('/shop/') && pathname !== '/shop';
    if (isMerchantPage && alternateUrl) {
      // Check if alternateUrl matches the target domain (for switching to alternate language)
      try {
        const urlObj = new URL(alternateUrl);
        // If we're switching to the alternate language and have an alternate URL, use it
        if (urlObj.hostname === language.domain || urlObj.hostname.endsWith('.' + language.domain)) {
          return alternateUrl;
        }
      } catch {
        // Invalid URL, fall through to default mapping
      }
    }

    // Map current path to alternate domain path (fallback for main pages or when no alternate URL)
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

