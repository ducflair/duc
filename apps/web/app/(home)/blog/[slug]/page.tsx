import { blogSource } from '@/lib/source'
// import { createMetadata } from '@/utils/metadata'
import { Description } from '@/components/typography'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Icons } from '@/components/ui/icons'
import { url, getAuthors } from '@/app/layout.config';
import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import mdxComponents from '@/components/mdxComponents'

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = blogSource.getPage([params.slug]);
  
  if (!page) notFound()
  const authors = getAuthors(page.data.authors)
  const { body: MDX, toc } = await page.data.load();

  return (
    <div className='min-h-screen max-w-[900px] flex flex-col items-center mx-auto'>
      <div className="container  py-12 md:px-8">
        <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
          {page.data.title}
        </h1>
        <Description>{page.data.description}</Description>
        
        {page.data.cover && (
          <div className="mt-8 relative w-full aspect-16/9 rounded-lg overflow-hidden">
            <img
              src={page.data.cover}
              alt={`Cover image for ${page.data.title}`}
              className="object-cover w-full"
            />
          </div>
        )}
      </div>
      <article className="container px-0 pb-12 pt-8 lg:px-4">
        <div className="prose min-w-0 flex-1 p-4">
          <MDX components={{ ...mdxComponents }} />
        </div>
      </article>

      {/* <InlineTOC items={toc} /> */}
      
      <div className='grow' />
      <div className="container border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-center py-6 px-4 lg:px-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            {authors?.map((author, index) => (
              <Link
                key={author.name}
                href={author.url ?? ''}
                aria-description={`Author ${index + 1}`}
              >
                <Button variant="ghost">
                  <Avatar className='w-7 h-7'>
                    <AvatarImage src={author.image} />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{author.name}</p>
                </Button>
              </Link>
            ))}
          </div>
          {page.data.date && (
            <p className="text-sm font-medium text-fd-muted-foreground">
              {new Date(page.data.date).toLocaleDateString('en-GB', {
                dateStyle: 'full'
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}



export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const blog = blogSource.getPage([params.slug]);

  if (!blog) notFound();
  const authors = getAuthors(blog?.data.authors);

  return {
    title: blog.data.title,
    description: blog.data.description,
    authors: authors?.map((author) => ({ name: author.name })),
    alternates: {
      canonical: url(blog.url),
    },
    openGraph: {
      title: blog.data.title,
      description: blog.data.description,
      type: 'article',
      publishedTime: blog.data.date ? new Date(blog.data.date).toISOString() : undefined,
      authors: authors?.map((author) => author.name),
      images: blog.data.cover ? blog.data.cover : undefined,
      url: url(blog.url),
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.data.title,
      description: blog.data.description,
      images: blog.data.cover ? blog.data.cover : undefined,
    },
  };
}

export function generateStaticParams(): { slug: string }[] {
  return blogSource.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}