"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface NavigationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NavigationMenu({ open, onOpenChange }: NavigationMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [popularMerchants, setPopularMerchants] = useState<Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  }>>([]);

  // Fetch hotstore merchants when menu opens
  useEffect(() => {
    if (open) {
      const marketKey = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
      fetch(`/api/hotstore?market=${marketKey}`)
        .then(res => res.json())
        .then(data => {
          if (data.merchants) {
            setPopularMerchants(data.merchants);
          }
        })
        .catch(err => {
          console.error('Error fetching hotstore merchants:', err);
        });
    }
  }, [open]);

  const navigationLinks = [
    { href: "/", label: "主頁" },
    { href: "/special-offers", label: "最新快閃優惠" },
    { href: "/submit-coupons", label: "提交優惠券" },
    { href: "#faq", label: "常見問題" },
    { href: "/submit-coupons", label: "聯絡我們" },
    { href: "/about", label: "關於我們" },
  ];

  const handleLinkClick = (href: string) => {
    if (href.startsWith("#")) {
      // Handle anchor links
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(href);
    }
    onOpenChange(false);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] md:w-[500px] overflow-y-auto bg-gray-900 md:bg-stone-50"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">
            <Link href="/" onClick={() => onOpenChange(false)} className="md:hidden">
              <span className="text-pink-500 text-2xl font-bold">dealy</span>
            </Link>
            <Link href="/" onClick={() => onOpenChange(false)} className="hidden md:block">
              <Image 
                src="/dealytwlogo.svg"
                alt="dealy logo"
                width={120}
                height={32}
                className="h-8 w-auto"
                sizes="(max-width: 768px) 100px, 120px"
                loading="lazy"
              />
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation Links */}
        <nav className="space-y-2 mb-8">
          {navigationLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleLinkClick(link.href)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isActive(link.href)
                  ? "bg-gray-800 md:bg-gray-200 text-red-400 md:text-red-600 font-semibold"
                  : "text-white md:text-gray-800 hover:bg-gray-800 md:hover:bg-gray-100"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Mobile-only: Popular Merchants Section */}
        {popularMerchants.length > 0 && (
          <div className="md:hidden border-t border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              台灣最新折扣優惠
            </h3>
            <div className="space-y-4">
              {popularMerchants.slice(0, 6).map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/shop/${merchant.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {merchant.logoUrl ? (
                    <Image
                      src={merchant.logoUrl}
                      alt={merchant.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                      sizes="48px"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-400">{merchant.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-200">{merchant.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

