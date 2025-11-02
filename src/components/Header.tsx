"use client";
import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavigationMenu from "@/components/NavigationMenu";

const Header = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const query = formData.get('search') as string;
    if (query && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <img 
              src="/dealytwlogo.svg"
              alt="dealy logo"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="/shop" className="text-sm text-gray-700 hover:text-primary transition-colors">全部商店</a>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              type="text"
              placeholder="搜尋最抵Deal"
              className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </form>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="md:hidden relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              type="text"
              placeholder="搜尋"
              className="pl-10 pr-4 py-2 w-32 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </form>
          
          <Button variant="ghost" size="sm" className="hidden md:flex text-sm">
            最新快訊訊息
          </Button>
          <Link href="/submit-coupons">
            <Button variant="ghost" size="sm" className="hidden md:flex text-sm">
              提交優惠券
            </Button>
          </Link>
          {/* Hamburger Menu Button - Visible on all screens */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMenuOpen(true)}
            className="flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <NavigationMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
};

export default Header;
