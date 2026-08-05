import defaultMdxComponents from "fumadocs-ui/mdx";
import { Callout } from 'fumadocs-ui/components/callout';
import { RecentUpdatesSection } from './RecentUpdatesSection';
import { Mermaid } from './mdx/mermaid';
import Image from 'next/image';

const mdxComponents = {
  ...defaultMdxComponents,
  Callout,
  RecentUpdatesSection,
  Mermaid,
  Image,
};

export default mdxComponents;