const { build } = require("esbuild");
const { sassPlugin } = require("esbuild-sass-plugin");
const { externalGlobalPlugin } = require("esbuild-plugin-external-global");

const browserConfig = {
  entryPoints: ["index.tsx"],
  bundle: true,
  format: "esm",
  plugins: [
    sassPlugin({
      quietDeps: true,
    }),
    externalGlobalPlugin({
      react: "React",
      "react-dom": "ReactDOM",
    }),
  ],
  splitting: true,
  loader: {
    ".woff2": "copy",
    ".ttf": "copy",
  },
};

const createESMBrowserBuild = async () => {
  // Development unminified build with source maps
  await build({
    ...browserConfig,
    outdir: "dist/browser/dev",
    sourcemap: true,
    chunkNames: "excalidraw-assets-dev/[name]-[hash]",
    define: {
      "import.meta.env": JSON.stringify({ DEV: true }),
    },
    logLevel: "error", // Set log level to error
  });

  // production minified build without sourcemaps
  await build({
    ...browserConfig,
    outdir: "dist/browser/prod",
    minify: true,
    chunkNames: "excalidraw-assets/[name]-[hash]",
    define: {
      "import.meta.env": JSON.stringify({ PROD: true }),
    },
    logLevel: "error", // Set log level to error
  });
};

const rawConfig = {
  entryPoints: ["index.tsx"],
  bundle: true,
  format: "esm",
  plugins: [
    sassPlugin({
      quietDeps: true,
    }),
  ],
  loader: {
    ".woff2": "copy",
    ".ttf": "copy",
    ".json": "copy",
  },
  packages: "external",
};

const createESMRawBuild = async () => {
  // Development unminified build with source maps
  await build({
    ...rawConfig,
    sourcemap: true,
    outdir: "dist/dev",
    define: {
      "import.meta.env": JSON.stringify({ DEV: true }),
    },
    logLevel: "error", // Set log level to error
  });

  // production minified build without sourcemaps
  await build({
    ...rawConfig,
    minify: true,
    outdir: "dist/prod",
    define: {
      "import.meta.env": JSON.stringify({ PROD: true }),
    },
    logLevel: "error", // Set log level to error
  });
};

createESMRawBuild();
createESMBrowserBuild();
