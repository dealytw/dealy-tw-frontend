import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "聯絡我們/提交優惠券 | Dealy.TW",
  description: "提交您的優惠券或與我們聯絡",
};

export default function SubmitCouponsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Affiliate Disclaimer */}
      <div className="bg-gray-50 border-b border-gray-200 py-1 px-2">
        <div className="max-w-full mx-auto px-2">
          <p className="text-[8px] text-gray-600 text-center leading-tight">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
          </p>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            聯絡我們/提交優惠券
          </h1>
          
          <p className="text-gray-700 mb-8">
            歡迎您提交最新的優惠券資訊或與我們聯繫！我們會盡快回覆您的訊息。
          </p>

          {/* Contact & Submit Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">
                提交優惠券 / 聯絡我們
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  ✍️ 您的姓名 *
                </Label>
                <Input 
                  id="name" 
                  placeholder="請輸入您的姓名"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  💗 您的電郵地址 *
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@email.com"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="merchant" className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  🏪 商家名稱
                </Label>
                <Input 
                  id="merchant" 
                  placeholder="例如：Amazon、Uber Eats 等"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="coupon" className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  🎟️ 優惠券代碼 / 優惠詳情
                </Label>
                <Input 
                  id="coupon" 
                  placeholder="例如：SAVE20、FIRST50OFF 等"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="value" className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  💰 優惠金額
                </Label>
                <Input 
                  id="value" 
                  placeholder="例如：NT$300、20% OFF 等"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  ✉️ 您的訊息 / 意見 *
                </Label>
                <Textarea 
                  id="message" 
                  rows={8}
                  placeholder="請詳細描述您的優惠券資訊、問題或建議..."
                  required
                  className="w-full"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>小提示：</strong>提供更多詳情（如優惠券期限、使用條件等）可幫助我們更快速地處理您的提交。謝謝！
                </p>
              </div>

              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg font-semibold">
                📧 提交
              </Button>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  ℹ️ 提交須知
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• 請確保優惠券資訊準確有效</p>
                <p>• 我們會在 3-5 個工作天內回覆</p>
                <p>• 您的個人資料將被嚴格保密</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  📞 其他聯絡方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• 電郵：contact@dealy.tw</p>
                <p>• 追蹤我們的最新優惠資訊</p>
                <p>• 感謝您的支持與信任</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

