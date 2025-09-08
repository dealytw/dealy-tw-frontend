import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Dealy - 香港最佳優惠碼平台",
  description: "發現最新最優惠的折扣碼，為你的購物節省更多。Dealy 為您精選 Trip.com、Booking.com 等知名商店的優惠碼，100% 免費使用。",
  authors: [{ name: "Dealy" }],
  openGraph: {
    title: "Dealy - 香港最佳優惠碼平台",
    description: "發現最新最優惠的折扣碼，為你的購物節省更多。精選知名商店優惠碼，100% 免費使用。",
    type: "website",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lovable_dev",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
