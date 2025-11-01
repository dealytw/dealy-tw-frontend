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
 * Maps current TW site path to equivalent HK site path
 * Since pages differ, we map to main pages only
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

  // For specific merchant/coupon pages, just go to homepage
  // since pages are different between domains
  return "/";
}

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const domainConfig = getDomainConfig();
  const currentLanguage = LANGUAGES.find((lang) => lang.domain === domainConfig.domain) || LANGUAGES[0];

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

  const handleLanguageChange = (language: LanguageOption) => {
    if (language.code === currentLanguage.code) {
      setIsOpen(false);
      return;
    }

    // Map current path to alternate domain path
    const alternatePath = mapPathToAlternateDomain(pathname, language.domain);
    const alternateUrl = `https://${language.domain}${alternatePath}`;

    // Navigate to alternate domain
    window.location.href = alternateUrl;
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
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                language.code === currentLanguage.code
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

