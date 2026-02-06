"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// Removed Next.js Image import - using regular img tags for fixed resolution
import NavigationMenu from "@/components/NavigationMenu";
import SearchDropdown from "@/components/SearchDropdown";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container h-16 px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full items-center justify-between">
          {/* Logo - plain <a> for instant response (works before hydration) */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img 
                src="/newdealylogo_150x79.png"
                alt="dealy logo"
                width={150}
                height={79}
                style={{ aspectRatio: '150/79', maxHeight: '40px', height: 'auto', width: 'auto' }}
                className="h-auto"
                loading="eager"
                fetchPriority="high"
              />
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link href="/shop" className="text-sm text-gray-700 hover:text-primary transition-colors">全部商店</Link>
            <SearchDropdown placeholder="搜尋超值好康" className="w-80" />
          </nav>

          {/* Right Actions - Use Link directly for progressive enhancement (works before hydration) */}
          <div className="flex items-center space-x-3">
            <Link 
              href="/special-offers" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 px-4 transition-colors"
            >
              特別優惠專區
            </Link>
            <Link 
              href="/submit-coupons" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 px-4 transition-colors"
            >
              提交優惠券
            </Link>
            {/* Hamburger Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMenuOpen(true)}
              aria-label="開啟選單"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Layout - Search bar gets flex-1 for full width */}
        <div className="md:hidden flex h-full items-center gap-2 min-w-0">
          {/* Logo - plain <a> for instant response (works before hydration) */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img 
                src="/newdealylogo_120x63.png"
                alt="dealy logo"
                width={120}
                height={63}
                style={{ aspectRatio: '120/63', maxHeight: '40px', height: 'auto', width: 'auto' }}
                className="h-auto"
                loading="eager"
                fetchPriority="high"
              />
            </a>
          </div>

          {/* Search Bar - Center, takes remaining space (flex-1 + min-w-0 for proper flex shrink) */}
          <div className="flex-1 min-w-0">
            <SearchDropdown placeholder="搜尋超值好康" className="w-full min-w-0 max-w-full" />
          </div>

          {/* Menu Button - Right */}
          <div className="flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMenuOpen(true)}
              aria-label="開啟選單"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <NavigationMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
};

export default Header;
