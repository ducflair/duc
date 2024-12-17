import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema
} from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'
import { z } from 'zod'

const baseSchema = frontmatterSchema.extend({
  title: z.string().min(1),
  description: z.string(),
  tag: z.string().optional(),
  authors: z.array(z.string()).optional(),
  date: z.string().date().or(z.date()).optional(),
  cover: z.string().optional(),
});

const docsMetaSchema = baseSchema.extend({
});
const blogMetaSchema = baseSchema.extend({
});
const pageMetaSchema = baseSchema.extend({
});



export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSmartypants],
    rehypePlugins: [rehypeCode],
  }
})

export const { docs, meta } = defineDocs({
  docs: {
    async: true,
  },
  meta: {
    schema: docsMetaSchema,
  }
})


const blogDir = 'content/blog'
export const blogCollection = defineCollections({
  type: 'doc',
  dir: blogDir,
  async: true,
  schema: blogMetaSchema,
});
export const blogMeta = defineCollections({
  type: 'meta',
  dir: blogDir,
  schema: blogMetaSchema,
});

const pageDir = 'content/pages'
export const pageCollection = defineCollections({
  type: 'doc',
  dir: pageDir,
  async: true,
  schema: pageMetaSchema,
});
export const pageMeta = defineCollections({
  type: 'meta',
  dir: pageDir,
  schema: pageMetaSchema,
});

