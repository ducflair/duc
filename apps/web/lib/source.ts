import { docs, meta, pageCollection, blogCollection, pageMeta, blogMeta } from '@/.source'
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta),
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogCollection, blogMeta)
})

export const pageSource = loader({
  baseUrl: '/pages',
  source: createMDXSource(pageCollection, pageMeta)
})
