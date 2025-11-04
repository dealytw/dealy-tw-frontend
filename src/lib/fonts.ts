// Font optimization with next/font
// Using Noto Sans TC for Traditional Chinese support
import { Noto_Sans_TC } from 'next/font/google';

// Configure Noto Sans TC font with display: swap and subset
export const notoSansTC = Noto_Sans_TC({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700'], // Only required weights
  variable: '--font-noto-sans-tc',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

