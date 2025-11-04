"use client";

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
      slug: string;
    }>;
  };
}

const DealySidebar = ({ popularMerchants, sidebarCategories }: DealySidebarProps) => {
  const router = useRouter();

  return (
    <div className="w-80 space-y-6">
      {/* Popular Merchants */}
      {popularMerchants && (
        <Card className="p-6">
          <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-800">熱門商店</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {popularMerchants.items && popularMerchants.items.length > 0 ? (
              popularMerchants.items.map((merchant: any) => (
                <div 
                  key={merchant.id} 
                  className="text-center cursor-pointer group"
                  onClick={() => router.push(`/shop/${merchant.slug}`)}
                >
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <Image 
                      src={merchant.logoUrl} 
                      alt={merchant.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      sizes="64px"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs text-blue-600 font-medium leading-tight">
                    {merchant.name}
                  </p>
                </div>
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
        <Card className="p-6">
          <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-800">熱門分類</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sidebarCategories.categories && sidebarCategories.categories.length > 0 ? (
              sidebarCategories.categories.map((category: any) => (
                <span 
                  key={category.id}
                  className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => router.push(`/category/${category.slug}`)}
                >
                  #{category.name}
                </span>
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
