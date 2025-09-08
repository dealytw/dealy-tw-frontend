"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

interface Merchant {
  id: string;
  name: string;
  logo: string;
  letter: string;
}

const Shop = () => {
  const [activeFilter, setActiveFilter] = useState("A");

  // Mock merchant data organized by letter
  const merchants: Merchant[] = [
    // A
    { id: "adidas", name: "adidas HK", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "aeon", name: "AEON", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "agoda", name: "Agoda", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "alipay", name: "Alipay HK", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "amazon", name: "Amazon JP", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "american-eagle", name: "American Eagle", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "apple", name: "Apple", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "arena", name: "Arena", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "armani", name: "Armani beauty", logo: "/api/placeholder/120/120", letter: "A" },
    { id: "asos", name: "Asos", logo: "/api/placeholder/120/120", letter: "A" },
    
    // B
    { id: "birdie", name: "Birdie", logo: "/api/placeholder/120/120", letter: "B" },
    { id: "bobbi-brown", name: "Bobbi Brown", logo: "/api/placeholder/120/120", letter: "B" },
    { id: "booking", name: "Booking.com", logo: "/api/placeholder/120/120", letter: "B" },
    { id: "bowtie", name: "Bowtie insurance", logo: "/api/placeholder/120/120", letter: "B" },
    { id: "buyandship", name: "Buyandship", logo: "/api/placeholder/120/120", letter: "B" },
    
    // C
    { id: "calvin-klein", name: "Calvin Klein", logo: "/api/placeholder/120/120", letter: "C" },
    { id: "catalog", name: "Catalog", logo: "/api/placeholder/120/120", letter: "C" },
    { id: "cathay-pacific", name: "Cathay Pacific", logo: "/api/placeholder/120/120", letter: "C" },
    { id: "charles-keith", name: "CHARLES & KEITH", logo: "/api/placeholder/120/120", letter: "C" },
    { id: "charlotte-tilbury", name: "CharlotteTilbury", logo: "/api/placeholder/120/120", letter: "C" },
    
    // D
    { id: "deliveroo", name: "Deliveroo", logo: "/api/placeholder/120/120", letter: "D" },
    { id: "dyson", name: "Dyson", logo: "/api/placeholder/120/120", letter: "D" },
    
    // E
    { id: "expedia", name: "Expedia", logo: "/api/placeholder/120/120", letter: "E" },
    { id: "eshop", name: "EShop", logo: "/api/placeholder/120/120", letter: "E" },
    
    // F
    { id: "foodpanda", name: "foodpanda", logo: "/api/placeholder/120/120", letter: "F" },
    { id: "farfetch", name: "Farfetch", logo: "/api/placeholder/120/120", letter: "F" },
    
    // G
    { id: "grab", name: "Grab", logo: "/api/placeholder/120/120", letter: "G" },
    { id: "groupon", name: "Groupon", logo: "/api/placeholder/120/120", letter: "G" },
    
    // H
    { id: "hktvmall", name: "HKTVmall", logo: "/api/placeholder/120/120", letter: "H" },
    { id: "hsbc", name: "HSBC", logo: "/api/placeholder/120/120", letter: "H" },
    
    // I
    { id: "ikea", name: "IKEA", logo: "/api/placeholder/120/120", letter: "I" },
    { id: "iherb", name: "iHerb", logo: "/api/placeholder/120/120", letter: "I" },
    
    // J
    { id: "jomashop", name: "Jomashop", logo: "/api/placeholder/120/120", letter: "J" },
    
    // K
    { id: "klook", name: "Klook", logo: "/api/placeholder/120/120", letter: "K" },
    { id: "kkday", name: "KKday", logo: "/api/placeholder/120/120", letter: "K" },
    
    // L
    { id: "lotte", name: "Lotte", logo: "/api/placeholder/120/120", letter: "L" },
    
    // M
    { id: "mcdonalds", name: "McDonald's", logo: "/api/placeholder/120/120", letter: "M" },
    { id: "microsoft", name: "Microsoft", logo: "/api/placeholder/120/120", letter: "M" },
    
    // N
    { id: "netflix", name: "Netflix", logo: "/api/placeholder/120/120", letter: "N" },
    { id: "nike", name: "Nike", logo: "/api/placeholder/120/120", letter: "N" },
    
    // O
    { id: "olive-young", name: "OLIVE YOUNG", logo: "/api/placeholder/120/120", letter: "O" },
    
    // P
    { id: "pandora", name: "Pandora", logo: "/api/placeholder/120/120", letter: "P" },
    
    // Q
    { id: "qoo10", name: "Qoo10", logo: "/api/placeholder/120/120", letter: "Q" },
    
    // R
    { id: "rakuten", name: "Rakuten", logo: "/api/placeholder/120/120", letter: "R" },
    
    // S
    { id: "shopee", name: "Shopee", logo: "/api/placeholder/120/120", letter: "S" },
    { id: "spotify", name: "Spotify", logo: "/api/placeholder/120/120", letter: "S" },
    
    // T
    { id: "trip", name: "Trip.com", logo: "/api/placeholder/120/120", letter: "T" },
    { id: "taobao", name: "Taobao", logo: "/api/placeholder/120/120", letter: "T" },
    
    // U
    { id: "uber", name: "Uber", logo: "/api/placeholder/120/120", letter: "U" },
    { id: "uniqlo", name: "Uniqlo", logo: "/api/placeholder/120/120", letter: "U" },
    
    // V
    { id: "vans", name: "Vans", logo: "/api/placeholder/120/120", letter: "V" },
    
    // W
    { id: "watsons", name: "Watsons", logo: "/api/placeholder/120/120", letter: "W" },
    
    // X
    { id: "xbox", name: "Xbox", logo: "/api/placeholder/120/120", letter: "X" },
    
    // Y
    { id: "yoox", name: "YOOX", logo: "/api/placeholder/120/120", letter: "Y" },
    
    // Z
    { id: "zalora", name: "Zalora", logo: "/api/placeholder/120/120", letter: "Z" },
  ];

  // Generate alphabet letters
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Filter merchants by selected letter
  const filteredMerchants = merchants.filter(merchant => 
    activeFilter === "ALL" || merchant.letter === activeFilter
  );

  // Group merchants by letter for display
  const groupedMerchants = filteredMerchants.reduce((acc, merchant) => {
    if (!acc[merchant.letter]) {
      acc[merchant.letter] = [];
    }
    acc[merchant.letter].push(merchant);
    return acc;
  }, {} as Record<string, Merchant[]>);

  const handleMerchantClick = (merchantId: string) => {
    window.location.href = `/merchant/${merchantId}`;
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
          {Object.keys(groupedMerchants).sort().map((letter) => (
            <div key={letter}>
              {/* Letter Header */}
              <h2 className="text-xl font-bold text-gray-800 mb-6">{letter}</h2>
              
              {/* Merchants Grid for this letter */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {groupedMerchants[letter].map((merchant) => (
                  <div 
                    key={merchant.id}
                    className="text-center cursor-pointer group"
                    onClick={() => handleMerchantClick(merchant.id)}
                  >
                    {/* Merchant Logo - Rounded */}
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-2 group-hover:shadow-lg transition-shadow">
                      <img 
                        src={merchant.logo}
                        alt={merchant.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    
                    {/* Merchant Name */}
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      {merchant.name}
                    </p>
                  </div>
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
      </main>
      
      <Footer />
    </div>
  );
};

export default Shop;
