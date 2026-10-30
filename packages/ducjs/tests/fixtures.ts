import fs from "node:fs";
import path from "node:path";

export const FIXTURE_CDN = "https://cdn.jsdelivr.net/gh/ducflair/fixtures@main/src";
export const FIXTURE_GITHUB_RAW = "https://raw.githubusercontent.com/ducflair/fixtures/main/src";

export const OFFICIAL_DUC_FILES = [
  "barrel-sauna.duc",
  "blocks_instances.duc",
  "colosseum.duc",
  "empire-state-building.duc",
  "fielconforto-electric-cable-layout.duc",
  "heads.duc",
  "microscope-core.duc",
  "model-element-fonts.duc",
  "ponte-d-antonia-ferreira.duc",
  "satellite.duc",
  "universal.duc",
  "welcome-to-scopture.duc",
] as const;

export type OfficialDucFileName = (typeof OFFICIAL_DUC_FILES)[number];

/**
 * Resolves the primary fixture cache directory.
 */
export function getFixturesCacheDir(category: string = "duc-files"): string {
  if (process.env.DUC_FIXTURES_DIR) {
    return path.resolve(process.env.DUC_FIXTURES_DIR, category);
  }
  // Try locating repository root
  const repoRoot = path.resolve(import.meta.dir, "../../..");
  const cacheDir = path.join(repoRoot, ".cache", "fixtures", category);
  fs.mkdirSync(cacheDir, { recursive: true });
  return cacheDir;
}

/**
 * Downloads a fixture from CDN or GitHub raw fallback and caches it locally.
 */
export async function downloadFixture(category: string, filename: string): Promise<Uint8Array> {
  const relPath = `${category}/${filename}`;
  const primaryUrl = `${FIXTURE_CDN}/${relPath}`;
  const fallbackUrl = `${FIXTURE_GITHUB_RAW}/${relPath}`;

  const fetchRaw = async (url: string, timeoutMs: number = 60000): Promise<Uint8Array | null> => {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "duc-test-runner/1.0",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) return null;
      const buffer = await resp.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Check if jsDelivr returned plain-text size limit warning
      if (bytes.length < 200) {
        const text = new TextDecoder().decode(bytes);
        if (text.startsWith("File size exceeded") || text.startsWith("Package size exceeded")) {
          return null;
        }
      }
      return bytes;
    } catch {
      return null;
    }
  };

  let data = await fetchRaw(primaryUrl, 4000);
  if (!data) {
    data = await fetchRaw(fallbackUrl, 60000);
  }

  if (!data) {
    throw new Error(`Failed to download test fixture "${relPath}" from both CDN and GitHub raw`);
  }

  return data;
}

/**
 * Returns the local filesystem path to a cached fixture, downloading it if not present.
 */
export async function getFixturePath(category: string, filename: string): Promise<string> {
  const cacheDir = getFixturesCacheDir(category);
  const targetPath = path.join(cacheDir, filename);

  // Check if already cached with non-zero size
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
    return targetPath;
  }

  // Check fallback local locations (e.g. tests/fixtures or legacy assets/testing)
  const localCandidates = [
    path.resolve(import.meta.dir, "fixtures", category, filename),
    path.resolve(import.meta.dir, "../../../assets/testing", category, filename),
  ];
  for (const cand of localCandidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).size > 0) {
      fs.copyFileSync(cand, targetPath);
      return targetPath;
    }
  }

  // Download and write to cache
  const data = await downloadFixture(category, filename);
  fs.writeFileSync(targetPath, data);
  return targetPath;
}

/**
 * Returns raw bytes of a fixture, downloading and caching locally if needed.
 */
export async function getFixtureBytes(category: string, filename: string): Promise<Uint8Array> {
  const filePath = await getFixturePath(category, filename);
  return new Uint8Array(await Bun.file(filePath).arrayBuffer());
}

/**
 * Convenience helper for .duc files.
 */
export async function getDucFixturePath(filename: string): Promise<string> {
  return getFixturePath("duc-files", filename);
}

/**
 * Convenience helper for .duc file bytes.
 */
export async function getDucFixtureBytes(filename: string): Promise<Uint8Array> {
  return getFixtureBytes("duc-files", filename);
}

/**
 * Ensures all official .duc fixtures are downloaded and available in the cache directory.
 */
export async function ensureAllDucFixtures(): Promise<string[]> {
  const paths: string[] = [];
  for (const name of OFFICIAL_DUC_FILES) {
    paths.push(await getDucFixturePath(name));
  }
  return paths;
}
