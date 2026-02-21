import type { ExportedDataState } from 'ducjs';

// Font families that are bundled in the WASM binary (no need to fetch)
const BUNDLED_FONTS = new Set(['Roboto Mono']);

// Metadata JSON URL (small file, cacheable via CDN)
const GOOGLE_FONTS_METADATA_URL = 'https://cdn.jsdelivr.net/npm/google-font-metadata@6/data/google-fonts-v1.json';

const TRUSTED_FONT_DOMAINS = new Set([
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
]);

function isTrustedFontUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'https:' && TRUSTED_FONT_DOMAINS.has(url.hostname);
  } catch {
    return false;
  }
}

// In-memory cache for the metadata JSON (fetched once per session)
let metadataCache: Record<string, GoogleFontV1Entry> | null = null;
let metadataFetchPromise: Promise<Record<string, GoogleFontV1Entry> | null> | null = null;

interface GoogleFontV1Entry {
  family: string;
  id: string;
  weights: number[];
  styles: string[];
  defSubset: string;
  variants: Record<string, Record<string, Record<string, { url: { truetype?: string; woff2?: string } }>>>;
}

/**
 * Fetch and cache the google-font-metadata v1 JSON.
 */
async function getGoogleFontMetadata(): Promise<Record<string, GoogleFontV1Entry> | null> {
  if (metadataCache) return metadataCache;
  if (metadataFetchPromise) return metadataFetchPromise;

  metadataFetchPromise = (async () => {
    try {
      const res = await fetch(GOOGLE_FONTS_METADATA_URL);
      if (!res.ok) return null;
      metadataCache = await res.json();
      return metadataCache;
    } catch {
      return null;
    } finally {
      metadataFetchPromise = null;
    }
  })();

  return metadataFetchPromise;
}

/**
 * Convert a display font family name (e.g. "Roboto Mono") to the metadata key ("roboto-mono").
 */
const fontFamilyToId = (family: string): string =>
  family.toLowerCase().replace(/\s+/g, '-');

/**
 * Look up the TTF (truetype) URL for a font from cached metadata.
 */
function getTrueTypeUrl(
  metadata: Record<string, GoogleFontV1Entry>,
  family: string,
  weight = 400,
  style = 'normal',
): string | undefined {
  const id = fontFamilyToId(family);
  const font = metadata[id];
  if (!font) return undefined;

  const weightVariants = font.variants[String(weight)];
  if (!weightVariants) {
    const firstWeight = Object.keys(font.variants)[0];
    if (!firstWeight) return undefined;
    const fallback = font.variants[firstWeight];
    const styleVar = fallback?.[style] ?? Object.values(fallback ?? {})[0];
    const subset = styleVar?.[font.defSubset] ?? Object.values(styleVar ?? {})[0];
    return subset?.url?.truetype;
  }

  const styleVariants = weightVariants[style] ?? Object.values(weightVariants)[0];
  if (!styleVariants) return undefined;

  const subset = styleVariants[font.defSubset] ?? Object.values(styleVariants)[0];
  return subset?.url?.truetype;
}

/**
 * Validate that a fontFamily string is a real font name (not a numeric ID or empty).
 */
const isValidFontFamily = (ff: unknown): ff is string =>
  typeof ff === 'string' && ff.length > 0 && !/^\d+$/.test(ff);

/**
 * Extract unique font family names from parsed DUC elements.
 */
function collectFontFamilies(parsed: ExportedDataState): Set<string> {
  const families = new Set<string>();
  for (const el of (parsed.elements ?? [])) {
    if (el && typeof el === 'object' && 'fontFamily' in el) {
      const ff = (el as any).fontFamily;
      if (isValidFontFamily(ff)) families.add(ff);
    }
    if (el && (el as any).type === 'table' && Array.isArray((el as any).cells)) {
      for (const cell of (el as any).cells) {
        const ff = cell?.fontFamily ?? cell?.style?.fontFamily;
        if (isValidFontFamily(ff)) families.add(ff);
      }
    }
  }
  const defaultFF = parsed?.localState?.currentItemFontFamily;
  if (isValidFontFamily(defaultFF)) families.add(defaultFF);
  return families;
}

/**
 * Fetch font data for all detected families in a DUC file.
 * Returns fontMap and a list of warning messages for fonts that couldn't be fetched.
 */
export async function fetchFontsForDuc(
  parsed: ExportedDataState,
): Promise<{ fontMap: Map<string, Uint8Array>; warnings: string[] }> {
  const fontMap = new Map<string, Uint8Array>();
  const warnings: string[] = [];
  const families = collectFontFamilies(parsed);

  const toFetch = [...families].filter(f => !BUNDLED_FONTS.has(f));
  if (toFetch.length === 0) return { fontMap, warnings };

  const metadata = await getGoogleFontMetadata();
  if (!metadata) {
    warnings.push('Could not load Google Fonts metadata. Text will use the default font.');
    return { fontMap, warnings };
  }

  const results = await Promise.allSettled(
    toFetch.map(async (family) => {
      const ttfUrl = getTrueTypeUrl(metadata, family);
      if (!ttfUrl || !isTrustedFontUrl(ttfUrl)) return { family, bytes: null as Uint8Array | null };
      try {
        const res = await fetch(ttfUrl);
        if (!res.ok) return { family, bytes: null };
        const buf = await res.arrayBuffer();
        return { family, bytes: buf.byteLength > 1024 ? new Uint8Array(buf) : null };
      } catch {
        return { family, bytes: null };
      }
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { family, bytes } = result.value;
      if (bytes) {
        fontMap.set(family, bytes);
      } else {
        warnings.push(`Font "${family}" could not be fetched and will use the default font.`);
      }
    } else {
      warnings.push('A font fetch failed unexpectedly.');
    }
  }

  return { fontMap, warnings };
}
