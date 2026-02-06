"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
// Removed Next.js Image import - using regular img tags for fixed resolution

interface DealySidebarProps {
  popularMerchants?: {
    items: Array<{
      id: number;
      name: string;
      slug: string;
      logoUrl: string;
    }>;
  };
  sidebarCategories?: {
    categories: Array<{
      id: number;
      name: string;
      page_slug: string;
    }>;
  };
}

const DealySidebar = ({ popularMerchants, sidebarCategories }: DealySidebarProps) => {
  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0 lg:w-80 space-y-4 lg:space-y-6">
      {/* Popular Merchants */}
      {popularMerchants && (
        <Card className="p-4 lg:p-6">
          <div className="bg-yellow-100 text-center py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg mb-3 lg:mb-4">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-800">熱門商店</h3>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 lg:gap-4">
            {popularMerchants.items && popularMerchants.items.length > 0 ? (
              popularMerchants.items.map((merchant: any) => (
                <Link 
                  key={merchant.id} 
                  href={`/shop/${merchant.slug}`}
                  className="text-center group"
                >
                  <div className="w-10 h-10 lg:w-16 lg:h-16 mx-auto mb-1 lg:mb-2 rounded-full overflow-hidden bg-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <img 
                      src={merchant.logoUrl} 
                      alt={merchant.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs text-blue-600 font-medium leading-tight">
                    {merchant.name}
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-2 text-center py-4">
                <p className="text-xs text-gray-500">No merchants available</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Popular Categories */}
      {sidebarCategories && (
        <Card className="p-4 lg:p-6">
          <div className="bg-yellow-100 text-center py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg mb-3 lg:mb-4">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-800">熱門分類</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:gap-2">
            {sidebarCategories.categories && sidebarCategories.categories.length > 0 ? (
              sidebarCategories.categories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/category/${category.page_slug || category.slug}`}
                  className="text-[10px] lg:text-xs px-2 lg:px-3 py-1 lg:py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                >
                  #{category.name}
                </Link>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">No categories available</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DealySidebar;
