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
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/newdealylogo.png"
                alt="dealy logo"
                width={120}
                height={32}
                className="h-8 w-auto"
                loading="eager"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link href="/shop" className="text-sm text-gray-700 hover:text-primary transition-colors">全部商店</Link>
            <SearchDropdown placeholder="搜尋超值好康" className="w-64" />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Link href="/special-offers">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm"
                type="button"
              >
                特別優惠專區
              </Button>
            </Link>
            <Link href="/submit-coupons">
              <Button variant="ghost" size="sm" className="text-sm">
                提交優惠券
              </Button>
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

        {/* Mobile Layout - Grid with centered search */}
        <div className="md:hidden grid grid-cols-3 h-full items-center gap-2">
          {/* Logo - Left */}
          <div className="flex items-center justify-start">
            <Link href="/" className="flex items-center">
              <img 
                src="/newdealylogo.png"
                alt="dealy logo"
                width={100}
                height={32}
                className="h-8 w-auto"
                loading="eager"
              />
            </Link>
          </div>

          {/* Search Bar - Center */}
          <div className="flex items-center justify-center">
            <SearchDropdown placeholder="搜尋超值好康" className="w-full max-w-[280px]" />
          </div>

          {/* Menu Button - Right */}
          <div className="flex items-center justify-end">
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
