import { GITHUB_URL, REDDIT_URL } from '@/constants/links';
import { BLOG, DOCS, HOME } from '@/constants/routes';
import { Icons } from '@/components/ui/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { siteName } from '@/app/layout.config';

function Navbar() {
  return (
    <div className='fixed top-4 left-1/2 -translate-x-1/2 px-4 py-1 flex items-center gap-1 rounded-full bg-background/10 backdrop-blur-xl w-screen max-w-4xl'>
      <Link href={HOME}>
        <Button variant='ghost' className='flex items-center gap-1.5'>
          <Icons.duc className='size-5!' />
          <span className="text-2xl font-bold">{siteName}</span>
        </Button>
      </Link>
      <div className='flex items-center gap-2 grow justify-center'>
        <Link href={DOCS}>
          <Button variant='ghost' size='sm'>Documentation</Button>
        </Link>
        <Link href={BLOG}>
          <Button variant='ghost' size='sm'>Blog</Button>
        </Link>
      </div>

      <div>
        <Link href={GITHUB_URL}>
          <Button variant='ghost' size='sm'>
            <Icons.gitHub className='size-5!' />
          </Button>
        </Link>
        <Link href={REDDIT_URL}>
          <Button variant='ghost' size='sm'>
            <Icons.reddit className='size-5!' />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Navbar