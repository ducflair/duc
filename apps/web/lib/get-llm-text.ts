import type { InferPageType } from 'fumadocs-core/source';

export async function getLLMText(page: InferPageType<any>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
