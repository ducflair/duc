import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { MICROSCOPE_EXAMPLE_URL, PLAYGROUND_URL } from '@/constants/links';
import { DOCS } from '@/constants/routes';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 text-center min-h-screen">
      <div className="max-w-5xl w-full">
        <Link
          href={MICROSCOPE_EXAMPLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-2 mx-auto w-full md:w-auto hover:opacity-95 transition-opacity"
        >
          <Image
            src="/img/microscope-example.webp"
            alt="Duc File Format"
            width={1400}
            height={788}
            priority
            unoptimized
            className="mx-auto w-full md:w-auto rounded-xl object-contain md:h-[500px]"
          />
        </Link>
        <p className="mb-8 text-lg md:text-xl px-4 md:px-18 text-fd-muted-foreground max-w-4xl mx-auto">
          An open <strong>SQLite-based project-state format</strong> for physical-engineering work before execution
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
              Query it directly with standard SQL, index it with FTS5, or stream it across browsers,
              Python notebooks, and Rust services.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-2">Built-in Version Control</h3>
            <p className="text-muted-foreground">
              Every <code className="text-sm">.duc</code> container embeds a full Directed Acyclic Graph (DAG) revision engine. Track checkpoints, incremental deltas, branch points, and SHA-256 integrity checksums natively without external PLM tools or Git wrappers.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-2">Embedded Project Charter</h3>
            <p className="text-muted-foreground">
              Store project requirements, acceptance criteria, hard and soft constraints, decision logs, and issue references directly within relational database tables, linking execution decisions directly to spatial canvas elements.
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
