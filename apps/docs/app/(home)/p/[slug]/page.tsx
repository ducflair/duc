import { blogSource, pageSource } from '@/lib/source'
// import { createMetadata } from '@/utils/metadata'
import { Description } from '@/components/typography'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { url, getAuthors } from '@/app/layout.config';
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import mdxComponents from '@/components/mdxComponents'

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = pageSource.getPage([params.slug]);
  
  if (!page) notFound()
  const authors = getAuthors(page.data.authors)
  const { body: MDX, toc } = await page.data.load();

  return (
    <>
      <div className="container max-w-[900px] py-12 md:px-8">
        <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
          {page.data.title}
        </h1>
        <Description>{page.data.description}</Description>
        
        {page.data.cover && (
          <div className="mt-8 relative w-full aspect-[16/9] rounded-lg overflow-hidden">
            <img
              src={page.data.cover}
              alt={`Cover image for ${page.data.title}`}
              className="object-cover w-full"
            />
          </div>
        )}
      </div>
      <article className="container max-w-[900px] px-0 pb-12 pt-8 lg:px-4">
        <div className="prose min-w-0 flex-1 p-4">
          <MDX components={{ ...mdxComponents }} />
        </div>
      </article>
    </>
  )
}



export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = pageSource.getPage([params.slug]);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: url(page.url),
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
      publishedTime: page.data.date ? new Date(page.data.date).toISOString() : undefined,
      images: page.data.cover ? page.data.cover : undefined,
      url: url(page.url),
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: page.data.cover ? page.data.cover : undefined,
    },
  };
}

export function generateStaticParams(): { slug: string }[] {
  return blogSource.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}