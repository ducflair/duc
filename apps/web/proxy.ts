import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';

const { rewrite: rewriteDocs } = rewritePath('/docs{/*path}', '/llms.mdx/docs{/*path}');
const { rewrite: rewriteBlog } = rewritePath('/blog{/*path}', '/llms.mdx/blog{/*path}');
const { rewrite: rewritePages } = rewritePath('/pages{/*path}', '/llms.mdx/pages{/*path}');

export default function proxy(request: NextRequest) {
  if (isMarkdownPreferred(request)) {
    const pathname = request.nextUrl.pathname;
    const result = rewriteDocs(pathname) || rewriteBlog(pathname) || rewritePages(pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|icon.*\\.[a-z]+|apple-icon.*\\.[a-z]+|manifest\\.json|robots\\.txt|sitemap\\.xml).*)'],
};
