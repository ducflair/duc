import { createMDX } from 'fumadocs-mdx/next';
import path from 'node:path';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(import.meta.dirname, '../../'),
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.md',
        destination: '/llms.mdx/docs/:path*',
      },
      {
        source: '/docs.md',
        destination: '/llms.mdx/docs',
      },
      {
        source: '/blog/:path*.md',
        destination: '/llms.mdx/blog/:path*',
      },
      {
        source: '/blog.md',
        destination: '/llms.mdx/blog',
      },
      {
        source: '/pages/:path*.md',
        destination: '/llms.mdx/pages/:path*',
      },
      {
        source: '/pages.md',
        destination: '/llms.mdx/pages',
      },
    ];
  },
};

export default withMDX(config);
