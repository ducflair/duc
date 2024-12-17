import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { HOMEPAGE_IMG } from '@/constants/images';
import { EXCALIDRAW_URL, GITHUB_URL, REDDIT_URL } from '@/constants/links';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 text-center min-h-screen">
      <div className="max-w-4xl">
        <img src={HOMEPAGE_IMG} alt="Duc File Format" className="mb-8 mx-auto w-full md:w-auto bg-contain bg-center md:h-[400px]" />
        <p className="mb-8 text-lg px-24 text-fd-muted-foreground">
          An innovative and versatile format designed for precision in 2D CAD (computer-aided design),
          offering unprecedented levels of detail and flexibility.
        </p>
        
        <div className="flex justify-center gap-4 mb-12">
          <Link href="/docs">
            <Button>
              Documentation
            </Button>
          </Link>
          <Link href={REDDIT_URL} target="_blank" rel="noopener noreferrer">
            <Button variant={"outline"}>
              <Icons.reddit className='size-4' />
              Ask on Reddit
              <Icons.arrowUpRight className='size-4' />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="text-xl font-semibold mb-2">Structure Flexibility</h3>
            <p className="text-fd-muted-foreground">JSON-based format enabling easy integration and future AI capabilities.</p>
          </div>
          <div className="p-6 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="text-xl font-semibold mb-2">Dynamic Zoom</h3>
            <p className="text-fd-muted-foreground">Fluid transition between different unit scopes, from macro to micro scales.</p>
          </div>
          <div className="p-6 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="text-xl font-semibold mb-2">Layered Design</h3>
            <p className="text-fd-muted-foreground">Support for Notes, Loose, and Precise layers with unique properties.</p>
          </div>
        </div>

        <div className="mt-12 p-4 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
          <p className="text-sm">
            Based on <Link href={EXCALIDRAW_URL} target="_blank" rel="noopener noreferrer">Excalidraw</Link> - This project is so amazing that we managed to build a headless CAD canvas component out of it
          </p>
        </div>
      </div>
    </main>
  );
}
