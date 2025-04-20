import { source } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import mdxComponents from '@/components/mdxComponents';
import { getGithubLastEdit } from 'fumadocs-core/server';
import { githubDocsPath } from '@/app/layout.config';


export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  
  const path = `${githubDocsPath}/${page.file.path}`
  const time = await getGithubLastEdit({
    owner: 'ducflair',
    repo: 'duc',
    path,
  });
  const { body: MDX, toc } = await page.data.load();

  return (
    <DocsPage
      toc={toc}
      full
      editOnGithub={{
        owner: 'ducflair',
        repo: 'duc',
        sha: 'main',
        path,
      }}
      tableOfContent={{
        style: 'clerk',
        single: false,
      }}
      lastUpdate={time ? new Date(time) : undefined}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {/* <InlineTOC items={toc} /> */}
        <MDX components={{ ...mdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
