import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GITHUB_URL, PLAYGROUND_URL, REDDIT_URL } from '@/constants/links';
import { BLOG, DOCS, HOME } from '@/constants/routes';
import { Icons } from '@/components/ui/icons';
import Link from 'next/link';

export const siteName = 'Duc';
export const baseUrl = 'https://duc.ducflair.com';
export const description = 'Duc is a binary file format conceived for a new era of CAD design.';
export const githubDocsPath = 'apps/web/content/docs';
/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <div className='flex items-center gap-1.5'>
        <Icons.duc className='!size-5' />
        <span className="text-xl font-bold">{siteName}</span>
      </div>
    ),
  },
  links: [
    {
      text: "Documentation",
      url: DOCS,
      active: "nested-url",
    },
    {
      text: "Blog",
      url: BLOG,
      active: "nested-url",
    },
    {
      text: "Playground",
      url: PLAYGROUND_URL,
      active: "url",
    }
  ],
  githubUrl: GITHUB_URL,
  disableThemeSwitch: true,
};

export const url = (path: string) => `${baseUrl}${path}`;

interface Author {
  username: string;
  name: string;
  url: string;
  image: string;
}

export const authorsMeta: Author[] = [
  {
    username: 'jorgedanisc',
    name: 'Jorge Soares',
    url: 'https://twitter.com/jorgedanics',
    image: 'https://pbs.twimg.com/profile_images/1767695365845716993/OEDtg3U4_400x400.jpg',
  },
];

export const getAuthors = (authors?: string[]) => {
  return authors?.map((author) => {
    return authorsMeta.find((a) => a.username === author)!;
  });
};
