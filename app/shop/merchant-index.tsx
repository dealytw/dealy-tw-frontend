"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  letter: string;
  description?: string;
  affiliateLink?: string;
  market?: string;
}

interface MerchantIndexProps {
  merchants: Merchant[];
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  initialPage: number;
}

export default function MerchantIndex({ 
  merchants, 
  pagination, 
  initialPage 
}: MerchantIndexProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("ALL");

  // Generate alphabet letters with ALL option
  const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

  // Filter merchants by selected letter
  const filteredMerchants = useMemo(() => {
    return merchants.filter(merchant => 
      activeFilter === "ALL" || merchant.letter === activeFilter
    );
  }, [merchants, activeFilter]);

  // Group merchants by letter for display
  const groupedMerchants = useMemo(() => {
    return filteredMerchants.reduce((acc, merchant) => {
      if (!acc[merchant.letter]) {
        acc[merchant.letter] = [];
      }
      acc[merchant.letter].push(merchant);
      return acc;
    }, {} as Record<string, Merchant[]>);
  }, [filteredMerchants]);

  const handlePageChange = (newPage: number) => {
    router.push(`/shop?page=${newPage}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            🏬 All Shops
          </h1>
          
          {/* Alphabetical Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {alphabet.map((letter) => (
              <Badge
                key={letter}
                variant={activeFilter === letter ? "default" : "outline"}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  activeFilter === letter 
                    ? "bg-blue-500 text-white border-blue-500" 
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveFilter(letter)}
              >
                {letter}
              </Badge>
            ))}
          </div>
        </div>

        {/* Merchants Grid */}
        <div className="space-y-12">
          {Object.keys(groupedMerchants)
            .filter(letter => /^[A-Z]$/.test(letter)) // Only show English letters
            .sort()
            .map((letter) => (
            <div key={letter}>
              {/* Letter Header */}
              <h2 className="text-xl font-bold text-gray-800 mb-6">{letter}</h2>
              
              {/* Merchants Grid for this letter */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {groupedMerchants[letter].map((merchant) => (
                  <Link
                    key={merchant.id}
                    href={`/shop/${merchant.slug}`}
                    className="text-center group"
                  >
                    {/* Merchant Logo - Rounded */}
                    <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-white border border-gray-100 flex items-center justify-center group-hover:shadow-lg transition-shadow">
                      <Image 
                        src={merchant.logo}
                        alt={merchant.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        sizes="128px"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Merchant Name */}
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      {merchant.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到以 "{activeFilter}" 開頭的商店</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pageCount > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  上一頁
                </button>
              )}
              
              <span className="px-4 py-2 bg-blue-500 text-white rounded">
                {pagination.page} / {pagination.pageCount}
              </span>
              
              {pagination.page < pagination.pageCount && (
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  下一頁
                </button>
              )}
            </div>
          </div>
        )}

        {/* Total Count */}
        {pagination && (
          <div className="mt-8 text-center text-gray-600">
            共 {pagination.total} 個商店
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
