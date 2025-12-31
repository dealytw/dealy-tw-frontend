"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
// Removed Next.js Image import - using regular img tags for fixed resolution
import { X } from "lucide-react";
import { useSearchMerchants } from "@/components/SearchProvider";

interface NavigationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NavigationMenu({ open, onOpenChange }: NavigationMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Get hotstore merchants from context (fetched server-side in layout.tsx)
  const { hotstoreMerchants } = useSearchMerchants();
  const popularMerchants = hotstoreMerchants || [];

  const navigationLinks = [
    { href: "/", label: "主頁" },
    { href: "/special-offers", label: "最新快閃優惠" },
    { href: "/submit-coupons", label: "提交優惠券" },
    { href: "/faqs", label: "常見問題" },
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

  // Shared content for both mobile and desktop
  const menuContent = (
    <>
      {/* Close Button - Top Right (Mobile only) */}
      <button
        onClick={() => onOpenChange(false)}
        className="md:hidden absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X className="h-6 w-6 text-white" />
        <span className="sr-only">Close</span>
      </button>

      <div className="p-6 pt-16 md:pt-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">
            <Link href="/" onClick={() => onOpenChange(false)} className="flex items-center">
              <img 
                src="/newdealylogo.png"
                alt="dealy logo"
                width={150}
                height={40}
                className="h-10 w-auto"
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
                    <img
                      src={merchant.logoUrl}
                      alt={merchant.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
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
      </div>
    </>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Mobile: Right side with dark theme, leaves gap on left */}
      <SheetContent 
        side="right" 
        className="md:hidden w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] h-full overflow-y-auto bg-gray-900 p-0 [&>button]:hidden"
      >
        {menuContent}
      </SheetContent>

      {/* Desktop: Right side */}
      <SheetContent 
        side="right" 
        className="hidden md:block w-[500px] overflow-y-auto bg-stone-50"
      >
        {menuContent}
      </SheetContent>
    </Sheet>
  );
}

