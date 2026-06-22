import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { HOMEPAGE_IMG } from '@/constants/images';
import { PLAYGROUND_URL } from '@/constants/links';
import { DOCS } from '@/constants/routes';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 text-center min-h-screen">
      <div className="max-w-4xl">
        <img src={HOMEPAGE_IMG} alt="Duc File Format" className="mb-8 mx-auto w-full md:w-auto bg-contain bg-center md:h-[400px]" />
        <p className="mb-8 text-lg px-24 text-fd-muted-foreground">
          An open <strong>SQLite-backed</strong> 2D CAD file format, shipped with first-class
          libraries for <strong>Rust</strong>, <strong>Python</strong> and{' '}
          <strong>TypeScript</strong>
        </p>

        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          <Link href={DOCS}>
            <Button>
              Documentation
              <Icons.arrowRight className='size-4' />
            </Button>
          </Link>
          <Link href={PLAYGROUND_URL} target="_blank" rel="noopener noreferrer">
            <Button variant={"outline"}>
              Playground
              <Icons.arrowUpRight className='size-4' />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-2">SQLite at the core</h3>
            <p className="text-muted-foreground">
              A <code className="text-sm">.duc</code> file is a gzip-compressed SQLite database.
              Query it directly, version it, or stream it, the same file works from a browser, a
              Python notebook, or a Rust service.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-2">Dynamic scales</h3>
            <p className="text-muted-foreground">
              Fluid transition between unit scopes, from meters down to nanometers, in metric or
              imperial. At every level, 100 grid units resolve to a single measurement unit and
              each square holds an infinite density of points, so precision is never lost as you
              zoom between macro and micro.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-2">Infinite canvas</h3>
            <p className="text-muted-foreground">
              A boundless geometric surface anchored at (0, 0) with free negative coordinates.
              Pan and zoom without limits, the same file stays usable from a quick sketch to a
              city-scale plan.
            </p>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4 text-left">
          <Link
            href="https://crates.io/crates/duc"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70">Rust</div>
              <div className="font-mono text-sm">duc</div>
            </div>
            <Icons.arrowUpRight className='size-4' />
          </Link>
          <Link
            href="https://pypi.org/project/ducpy/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70">Python</div>
              <div className="font-mono text-sm">ducpy</div>
            </div>
            <Icons.arrowUpRight className='size-4' />
          </Link>
          <Link
            href="https://www.npmjs.com/package/ducjs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70">TypeScript</div>
              <div className="font-mono text-sm">ducjs</div>
            </div>
            <Icons.arrowUpRight className='size-4' />
          </Link>
        </div>
      </div>
    </main>
  );
}
