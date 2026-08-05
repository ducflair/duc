'use client';

import { use, useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <MermaidContent chart={chart} />;
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(
  key: string,
  createPromise: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);

  if (cached) {
    return cached as Promise<T>;
  }

  const promise = createPromise();
  cache.set(key, promise);

  return promise;
}

function MermaidContent({ chart }: MermaidProps) {
  const id = useId();
  const { resolvedTheme } = useTheme();

  const { default: mermaid } = use(
    cachePromise('mermaid', () => import('mermaid')),
  );

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    theme: resolvedTheme === 'dark' ? 'dark' : 'default',
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () =>
      mermaid.render(id, chart.replaceAll('\\n', '\n')),
    ),
  );

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto"
      ref={(container) => {
        if (container) {
          bindFunctions?.(container);
        }
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
