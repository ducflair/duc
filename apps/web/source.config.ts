import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import {
  defineCollections,
  defineConfig,
  defineDocs
} from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'
import { z } from 'zod'

const baseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  authors: z.array(z.string()).optional(),
  date: z.string().date().or(z.date()).optional(),
  cover: z.string().optional(),
});

export type BaseDocSchemaType = z.infer<typeof baseSchema>;

const docsMetaSchema = baseSchema.extend({});
const updatesMetaSchema = baseSchema.extend({
  date: z.string().date().or(z.date()),
});
const pageMetaSchema = baseSchema.extend({});

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSmartypants],
    rehypePlugins: [rehypeCode],
  }
})

export const { docs: docsCollection, meta: docsMeta } = defineDocs({
  docs: {
    async: true,
    schema: docsMetaSchema,
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
  schema: baseSchema,
});
export const blogMeta = defineCollections({
  type: 'meta',
  dir: blogDir,
  schema: baseSchema,
});

const updatesDir = 'content/updates'
export const updatesCollection = defineCollections({
  type: 'doc',
  dir: updatesDir,
  async: true,
  schema: updatesMetaSchema,
});
export const updatesMeta = defineCollections({
  type: 'meta',
  dir: updatesDir,
  schema: updatesMetaSchema,
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

