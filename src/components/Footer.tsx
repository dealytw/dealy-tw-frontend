import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dealy.TW</h3>
            <p className="text-sm text-gray-600 mb-4">
              最新優惠碼、折扣資訊一站式平台，幫你省更多！
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">快速連結</h4>
            <ul className="space-y-2">
              <li><a href="/shop" className="text-sm text-gray-600 hover:text-gray-900">所有商戶</a></li>
              <li><a href="/category/travel" className="text-sm text-gray-600 hover:text-gray-900">旅遊優惠</a></li>
              <li><a href="/category/shopping" className="text-sm text-gray-600 hover:text-gray-900">購物優惠</a></li>
              <li><a href="/special-offers" className="text-sm text-gray-600 hover:text-gray-900">特別優惠</a></li>
            </ul>
          </div>

          {/* Popular Merchants */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">熱門商戶</h4>
            <ul className="space-y-2">
              <li><a href="/shop/klook" className="text-sm text-gray-600 hover:text-gray-900">Klook</a></li>
              <li><a href="/shop/trip" className="text-sm text-gray-600 hover:text-gray-900">Trip.com</a></li>
              <li><a href="/shop/agoda" className="text-sm text-gray-600 hover:text-gray-900">Agoda</a></li>
              <li><a href="/shop/booking" className="text-sm text-gray-600 hover:text-gray-900">Booking.com</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">支援</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-sm text-gray-600 hover:text-gray-900">關於我們</a></li>
              <li><a href="/contact" className="text-sm text-gray-600 hover:text-gray-900">聯絡我們</a></li>
              <li><a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">私隱政策</a></li>
              <li><a href="/terms" className="text-sm text-gray-600 hover:text-gray-900">使用條款</a></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © 2025 Dealy.TW. 版權所有。
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <p className="text-xs text-gray-400">
              透過本站鏈接完成購物，我們可能會因此獲得佣金，而您無需額外付費。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
