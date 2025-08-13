import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const now = new Date().toISOString()
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${site}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}


