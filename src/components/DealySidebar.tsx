import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

const DealySidebar = () => {
  const [homepageData, setHomepageData] = useState<any>(null);

  // Fetch homepage data from CMS
  useEffect(() => {
    async function fetchHomepageData() {
      try {
        const response = await fetch('/api/homepage');
        const result = await response.json();
        if (result.ok && result.data) {
          setHomepageData(result.data);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      }
    }

    fetchHomepageData();
  }, []);

  return (
    <div className="w-80 space-y-6">
      {/* Popular Merchants */}
      {homepageData?.popularMerchants && (
        <Card className="p-6">
          <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-800">熱門商店</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {homepageData.popularMerchants.items && homepageData.popularMerchants.items.length > 0 ? (
              homepageData.popularMerchants.items.map((merchant: any) => (
                <div key={merchant.id} className="text-center cursor-pointer group">
                  <div className="w-16 h-16 mx-auto mb-2 border rounded-lg overflow-hidden bg-white flex items-center justify-center p-1 group-hover:shadow-md transition-shadow">
                    <img 
                      src={merchant.logoUrl} 
                      alt={merchant.name}
                      className="max-w-full max-h-full object-contain"
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
      {homepageData?.sidebarCategories && (
        <Card className="p-6">
          <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold text-gray-800">熱門分類</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {homepageData.sidebarCategories.categories && homepageData.sidebarCategories.categories.length > 0 ? (
              homepageData.sidebarCategories.categories.map((category: any) => (
                <span 
                  key={category.id}
                  className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full cursor-pointer hover:bg-blue-50 transition-colors"
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
