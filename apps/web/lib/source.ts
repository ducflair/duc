import { docsCollection, docsMeta, pageCollection, blogCollection, pageMeta, blogMeta } from '@/.source/server'
import { toFumadocsSource as createMDXSource } from 'fumadocs-mdx/runtime/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docsCollection, docsMeta),
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogCollection, blogMeta)
})

export const pageSource = loader({
  baseUrl: '/pages',
  source: createMDXSource(pageCollection, pageMeta)
})
