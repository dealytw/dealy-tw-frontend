/**
 * Shared sitemap data helpers.
 * Returns { pages, maxLastmod } for each sitemap type.
 * All lastmod values use UTC Z format (YYYY-MM-DDTHH:mm:ssZ).
 */

import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDailyUpdatedTime } from '@/lib/jsonld'

export type SitemapPage = { url: string; lastmod: string }

/** Format date to UTC Z (YYYY-MM-DDTHH:mm:ssZ) for sitemap lastmod */
function toUtcLastmod(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Get max lastmod from pages (UTC strings are lexicographically sortable) */
function getMaxLastmod(pages: SitemapPage[]): string {
  if (pages.length === 0) return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  return pages.reduce((max, p) => (p.lastmod > max ? p.lastmod : max), pages[0].lastmod)
}

export async function getPageSitemapData(baseUrl: string, market: string): Promise<{
  pages: SitemapPage[]
  maxLastmod: string
}> {
  const now = new Date()
  const nowUtc = toUtcLastmod(now)

  const staticPages: SitemapPage[] = [
    { url: baseUrl, lastmod: nowUtc },
    { url: `${baseUrl}/shop`, lastmod: nowUtc },
    { url: `${baseUrl}/special-offers`, lastmod: nowUtc },
  ]

  let legalPages: SitemapPage[] = []
  try {
    const legalsData = await strapiFetch<{ data: any[] }>(
      `/api/legals?${qs({
        'filters[market][key][$eq]': market,
        'fields[0]': 'page_slug',
        'fields[1]': 'updatedAt',
        'pagination[pageSize]': '100',
        'sort[0]': 'title:asc',
      })}`,
      { revalidate: 259200, tag: 'sitemap:legals' }
    )
    legalPages = (legalsData?.data || []).map((legal: any) => ({
      url: `${baseUrl}/${legal.page_slug || legal.slug}`,
      lastmod: legal.updatedAt ? toUtcLastmod(legal.updatedAt) : nowUtc,
    }))
  } catch (error) {
    console.error('Error fetching legal pages for sitemap:', error)
  }

  const pages = [...staticPages, ...legalPages]
  return { pages, maxLastmod: getMaxLastmod(pages) }
}

export async function getBlogSitemapData(baseUrl: string, marketKey: string): Promise<{
  pages: SitemapPage[]
  maxLastmod: string
}> {
  const now = new Date()
  const nowUtc = toUtcLastmod(now)

  let pages: SitemapPage[] = []
  try {
    const blogData = await strapiFetch<{ data: any[] }>(
      `/api/blogs?${qs({
        'filters[publishedAt][$notNull]': true,
        'filters[market][key][$eq]': marketKey,
        'fields[0]': 'page_slug',
        'fields[1]': 'updatedAt',
        'fields[2]': 'publishedAt',
        'pagination[pageSize]': '500',
        'sort[0]': 'publishedAt:desc',
      })}`,
      { revalidate: 259200, tag: 'sitemap:blog' }
    )
    pages = (blogData?.data || [])
      .filter((post: any) => post.publishedAt)
      .map((post: any) => ({
        url: `${baseUrl}/blog/${post.page_slug}`,
        lastmod: post.updatedAt
          ? toUtcLastmod(post.updatedAt)
          : post.publishedAt
            ? toUtcLastmod(post.publishedAt)
            : nowUtc,
      }))
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  return { pages, maxLastmod: getMaxLastmod(pages) }
}

export async function getShopSitemapData(baseUrl: string, market: string): Promise<{
  pages: SitemapPage[]
  maxLastmod: string
}> {
  let pages: SitemapPage[] = []
  try {
    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs({
        'filters[market][key][$eq]': market,
        'filters[publishedAt][$notNull]': 'true',
        'fields[0]': 'page_slug',
        'fields[1]': 'updatedAt',
        'fields[2]': 'publishedAt',
        'pagination[pageSize]': '500',
        'sort[0]': 'merchant_name:asc',
      })}`,
      { revalidate: 86400, tag: 'sitemap:merchants' }
    )
    pages = (merchantsData?.data || [])
      .filter((m: any) => m.publishedAt)
      .map((merchant: any) => {
        const slug = String(merchant.page_slug || merchant.slug || '')
        const url = `${baseUrl}/shop/${slug}`
        // Use TW-based daily time (Asia/Taipei), output as UTC Z (same moment)
        const lastmod = toUtcLastmod(getDailyUpdatedTime(`tw-shop-sitemap:${slug || 'unknown'}`))
        return { url, lastmod }
      })
  } catch (error) {
    console.error('Error fetching merchants for sitemap:', error)
  }

  return { pages, maxLastmod: getMaxLastmod(pages) }
}

export async function getTopicpageSitemapData(baseUrl: string, marketKey: string): Promise<{
  pages: SitemapPage[]
  maxLastmod: string
}> {
  const now = new Date()
  const nowUtc = toUtcLastmod(now)

  let pages: SitemapPage[] = []
  try {
    const topicsData = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs({
        'filters[market][key][$eq]': marketKey,
        'filters[publishedAt][$notNull]': true,
        'fields[0]': 'page_slug',
        'fields[1]': 'updatedAt',
        'fields[2]': 'publishedAt',
        'pagination[pageSize]': '500',
        'sort[0]': 'publishedAt:desc',
      })}`,
      { revalidate: 259200, tag: 'sitemap:topics' }
    )
    if (topicsData?.data && Array.isArray(topicsData.data)) {
      pages = topicsData.data
        .filter((topic: any) => topic.publishedAt && topic.page_slug)
        .map((topic: any) => ({
          url: `${baseUrl}/special-offers/${topic.page_slug}`,
          lastmod: topic.updatedAt
            ? toUtcLastmod(topic.updatedAt)
            : topic.publishedAt
              ? toUtcLastmod(topic.publishedAt)
              : nowUtc,
        }))
    }
  } catch (error) {
    console.error('Error fetching special offers for sitemap:', error)
  }

  return { pages, maxLastmod: getMaxLastmod(pages) }
}

export async function getCategorySitemapData(baseUrl: string, marketKey: string): Promise<{
  pages: SitemapPage[]
  maxLastmod: string
}> {
  const now = new Date()
  const nowUtc = toUtcLastmod(now)

  let pages: SitemapPage[] = []
  try {
    const categoriesData = await strapiFetch<{ data: any[] }>(
      `/api/categories?${qs({
        'filters[market][key][$eq]': marketKey,
        'fields[0]': 'page_slug',
        'fields[1]': 'updatedAt',
        'populate[market][fields][0]': 'key',
        'pagination[pageSize]': '100',
        'sort[0]': 'name:asc',
      })}`,
      { revalidate: 259200, tag: 'sitemap:categories' }
    )
    pages = (categoriesData?.data || []).map((category: any) => ({
      url: `${baseUrl}/category/${category.page_slug}`,
      lastmod: category.updatedAt ? toUtcLastmod(category.updatedAt) : nowUtc,
    }))
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error)
  }

  return { pages, maxLastmod: getMaxLastmod(pages) }
}
