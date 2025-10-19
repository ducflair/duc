declare module 'pdfjs-dist/lib/display/svg.js' {
  import type { PageViewport } from 'pdfjs-dist/types/src/display/display_utils';

  class SVGGraphics {
    constructor(commonObjs: unknown, objs: unknown, forceDataSchema?: boolean);
    embedFonts: boolean;
    getSVG(operatorList: unknown, viewport: PageViewport): Promise<SVGElement>;
  }

  export { SVGGraphics };
}
