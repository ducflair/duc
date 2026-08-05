import { baseUrl, description, siteName } from '@/app/layout.config';
import { BASE_OG_IMG } from '@/constants/images';
import './global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
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
    default: "Duc File",
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};


export default function Layout({ children }: { children: ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
  };

  return (
    <html lang="en" className={robotoMono.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NODE_ENV === 'production' && (
          <Script
            defer
            src="https://umami-liart-kappa.vercel.app/script.js"
            data-website-id="dbb88890-f4f6-45b1-8970-cb5d7d7b02b6"
            data-domains="duc.ducflair.com,"
          />
        )}
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
