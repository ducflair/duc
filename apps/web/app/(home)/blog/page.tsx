import { getAuthors, url } from '@/app/layout.config';
import { Icons } from '@/components/ui/icons';
import { BLOG, HOME } from '@/constants/routes';
import { blogSource } from '@/lib/source';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const title = 'Blog';
const description = 'Read our latest articles';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url(BLOG),
  },
  openGraph: {
    title,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default async function Page() {
  const blogs = blogSource.getPages().sort((a, b) => {
    if (!a.data.date || !b.data.date) return 0;
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });

  return (
    <div>
      <div className="container col min-h-screen">
        <div className="py-16 flex items-center gap-4">
          <h1 className="text-center ml-16 text-7xl font-bold">Blog</h1>
        </div>
        <div className="px-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {blogs.map((item) => (
            <Link
              href={item.url}
              key={item.url}
              className="flex flex-col gap-2 border rounded-lg overflow-hidden bg-card col hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-background-dark"
            >
              {item.data.cover && <img
                src={item.data.cover}
                alt={item.data.title}
                width={323}
                height={181}
                className="w-full"
              />}
              <span className="col flex-1 px-3 py-1">
                {item.data.tags && item.data.tags.length > 0 && (
                  <span className="font-mono text-xs mb-2">
                    {item.data.tags[0]}
                  </span>
                )}
                <span className="flex-1 mb-6">
                  <h2 className="text-xl font-semibold">{item.data.title}</h2>
                </span>
                <p className="text-sm text-muted-foreground truncate flex flex-wrap gap-1">
                  {getAuthors(item.data.authors)?.map(author => author.name).join(', ')}
                  {item.data.authors && item.data.date && <span>·</span>}
                  {item.data.date && (
                    <span>{new Date(item.data.date).toLocaleDateString()}</span>
                  )}
                </p>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}