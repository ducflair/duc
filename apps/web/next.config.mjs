import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
  },
  experimental: {
    turbo: false,
  }
};

export default withMDX(config);
