// src/lib/homepage-loader.ts
import { absolutizeMedia, getHomePageByMarketKey } from "./strapi";

export type HomePageData = {
  title: string;
  hero: { bgUrl: string; title?: string; subtitle?: string };
  // add more sections here as you wire them
};

export async function getHomePageData(marketKey: string): Promise<HomePageData> {
  const hp = await getHomePageByMarketKey(marketKey);
  if (!hp) throw new Error(`No HomePage entry found for market=${marketKey}`);

  // Data comes directly without attributes wrapper
  const a = hp ?? {};
  // hero can be repeatable or single; handle both
  const rawHero = Array.isArray(a.hero) ? a.hero[0] : a.hero;

  // Background URL is directly at background.url (not data.attributes.url)
  const rel = rawHero?.background?.url;
  if (!rel) {
    // we want this to fail loudly instead of returning 500 without context
    throw new Error("CMS: HomePage.hero.background is required but missing/not populated.");
  }

  const heroBgUrl = absolutizeMedia(rel);
  return {
    title: a.title ?? "",
    hero: {
      bgUrl: heroBgUrl,
      title: rawHero?.title,
      subtitle: rawHero?.subtitle,
    },
  };
}