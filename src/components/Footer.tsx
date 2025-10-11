import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ReUbird</h3>
            <p className="text-sm text-gray-600 mb-4">
              最新優惠碼、折扣資訊一站式平台，幫你省更多！
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
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
            © 2025 ReUbird. 版權所有。
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
