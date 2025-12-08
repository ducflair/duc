import { baseUrl, description, siteName } from '@/app/layout.config';
import { BASE_OG_IMG } from '@/constants/images';
import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Metadata } from 'next';
import { Roboto_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import Script from 'next/script';
import { BLOG, DOCS, HOME } from '@/constants/routes';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: {
    default: "Duc CAD File",
    template: `%s | ${siteName}`,
  },
  description,
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: siteName,
    description,
    siteName: siteName,
    url: baseUrl,
    type: 'website',
    images: [
      {
        url: BASE_OG_IMG,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
};


export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={robotoMono.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Script
          defer
          src="https://umami-liart-kappa.vercel.app/script.js"
          data-website-id="dbb88890-f4f6-45b1-8970-cb5d7d7b02b6"
          data-domains="duc.ducflair.com,"
        />
        <RootProvider
          search={{
            links: [
              ['Home', HOME],
              ['Docs', DOCS],
              ['Blog', BLOG],
            ],
          }}
        >
          {children}
          <Footer />
        </RootProvider>
      </body>
    </html>
  );
}
