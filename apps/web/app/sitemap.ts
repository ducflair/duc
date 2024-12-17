import { blogSource, pageSource, source } from '@/lib/source';
import type { MetadataRoute } from 'next';
import { url } from './layout.config';
import { BLOG, DOCS, HOME } from '@/constants/routes';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = blogSource.getPages();
  const docs = source.getPages();
  const pages = pageSource.getPages();
  return [
    {
      url: url(HOME),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: url(DOCS),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: url(BLOG),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...blogs.map((item) => ({
      url: url(item.url),
      lastModified: item.data.date,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
    ...docs.map((item) => ({
      url: url(item.url),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
    ...pages.map((item) => ({
      url: url(item.url),
      lastModified: item.data.date,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
  ];
}
