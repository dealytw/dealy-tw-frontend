import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/special-offers`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/coupons-demo`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  // Dynamic pages - these would ideally be fetched from your CMS
  // For now, we'll include some common merchant pages
  const merchantPages = [
    'klook',
    'trip',
    'agoda', 
    'booking',
    'expedia',
    'hotels',
    'airbnb',
    'cathay-pacific',
    'singapore-airlines',
    'emirates',
  ].map(slug => ({
    url: `${baseUrl}/shop/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Category pages
  const categoryPages = [
    'travel',
    'shopping',
    'food',
    'entertainment',
    'beauty',
    'fashion',
    'electronics',
    'home',
    'health',
    'finance',
  ].map(slug => ({
    url: `${baseUrl}/category/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Special offers pages
  const specialOfferPages = [
    '1111-deals',
    'black-friday',
    'cyber-monday',
    'christmas-deals',
    'new-year-sales',
  ].map(slug => ({
    url: `${baseUrl}/special-offers/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...merchantPages,
    ...categoryPages,
    ...specialOfferPages,
  ]
}
