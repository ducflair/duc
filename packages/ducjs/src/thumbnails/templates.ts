import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import type { ResolvedModelViewConfig } from "./cameraPresets";

/**
 * Escapes a string to safely embed it inside a script tag.
 */
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
}

/**
 * Finds a local file URL for an installed module in node_modules,
 * checking the monorepo root, current working directory, and known package paths.
 */
function findModulePath(subPath: string): string | null {
  try {
    if (typeof require !== "undefined" && typeof require.resolve === "function") {
      const resolved = require.resolve(subPath);
      if (fs.existsSync(resolved)) {
        return `file://${resolved}`;
      }
    }
  } catch {
    // Continue searching candidates
  }

  const roots = [CURRENT_DIR, process.cwd()];
  for (const root of roots) {
    let curr = root;
    while (curr && curr !== path.dirname(curr)) {
      const candidate = path.join(curr, "node_modules", subPath);
      if (fs.existsSync(candidate)) {
        return `file://${candidate}`;
      }
      const direct = path.join(curr, subPath);
      if (fs.existsSync(direct)) {
        return `file://${direct}`;
      }
      curr = path.dirname(curr);
    }
  }
  return null;
}

/**
 * Generates the import map JSON for Three.js and three-cad-viewer.
 */
function getImportMapJson(): string {
  const threePath =
    findModulePath("three/build/three.module.js") ??
    "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js";

  const tcvPath =
    findModulePath("three-cad-viewer/dist/three-cad-viewer.esm.js") ??
    "https://esm.sh/three-cad-viewer@5.0.0";

  return JSON.stringify(
    {
      imports: {
        three: threePath,
        "three-cad-viewer": tcvPath,
      },
    },
    null,
    2,
  );
}

export function buildRasterizedPdfThumbnailHtml(
  imageBase64: string,
  config: ResolvedModelViewConfig,
): string {
  const configJson = safeJsonStringify({
    background: config.background,
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body { display: flex; align-items: center; justify-content: center; }
    img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
  </style>
  <script>
    window.__thumbnailReady = false;
    window.__thumbnailError = null;
  </script>
</head>
<body>
  <img id="thumbnail" alt="">
  <script>
    const cfg = ${configJson};
    const image = document.getElementById("thumbnail");
    document.body.style.background = cfg.background || "transparent";
    image.addEventListener("error", () => {
      window.__thumbnailError = "Failed to decode the rasterized CAD preview.";
      window.__thumbnailReady = true;
    }, { once: true });
    image.src = "data:image/png;base64,${imageBase64}";
    image.decode().then(() => { window.__thumbnailReady = true; }).catch((error) => {
      window.__thumbnailError = error instanceof Error ? error.message : String(error);
      window.__thumbnailReady = true;
    });
  </script>
</body>
</html>`;
}

/**
 * Shared in-browser JavaScript function for trimming transparent borders and
 * compositing onto requested background without artificial raster upscaling.
 */
const IN_BROWSER_CROP_AND_SCALE_FN = `
function getOpaqueBounds(pixels, width, height, alphaThreshold) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha <= alphaThreshold) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

function cropAndScaleCanvasToOpaqueContent(sourceCanvas, targetLongEdge, options) {
  options = options || {};
  targetLongEdge = targetLongEdge || 1200;
  const sourceWidth = Math.max(1, sourceCanvas.width);
  const sourceHeight = Math.max(1, sourceCanvas.height);
  const sourceLongEdge = Math.max(sourceWidth, sourceHeight);
  const scanLongEdge = Math.max(1, Math.floor(options.scanLongEdge || sourceLongEdge));
  const scanScale = Math.min(1, scanLongEdge / sourceLongEdge);
  const scanWidth = Math.max(1, Math.round(sourceWidth * scanScale));
  const scanHeight = Math.max(1, Math.round(sourceHeight * scanScale));

  const scanCanvas = document.createElement("canvas");
  scanCanvas.width = scanWidth;
  scanCanvas.height = scanHeight;
  const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
  if (!scanCtx) return sourceCanvas;

  scanCtx.clearRect(0, 0, scanWidth, scanHeight);
  scanCtx.imageSmoothingEnabled = false;
  scanCtx.drawImage(sourceCanvas, 0, 0, scanWidth, scanHeight);

  const scanBounds = getOpaqueBounds(
    scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height).data,
    scanCanvas.width,
    scanCanvas.height,
    4
  );
  if (!scanBounds) return sourceCanvas;

  const paddingPx = Math.max(0, Math.floor(options.paddingPx !== undefined ? options.paddingPx : 2));
  const inverseScale = 1 / scanScale;
  const bounds = {
    minX: Math.max(0, Math.floor(scanBounds.minX * inverseScale) - paddingPx),
    minY: Math.max(0, Math.floor(scanBounds.minY * inverseScale) - paddingPx),
    maxX: Math.min(sourceWidth - 1, Math.ceil((scanBounds.maxX + 1) * inverseScale) + paddingPx - 1),
    maxY: Math.min(sourceHeight - 1, Math.ceil((scanBounds.maxY + 1) * inverseScale) + paddingPx - 1),
  };
  const trimmedWidth = bounds.maxX - bounds.minX + 1;
  const trimmedHeight = bounds.maxY - bounds.minY + 1;

  // Never stretch/upscale beyond native renderer resolution.
  // Downsample smoothly only if targetLongEdge is smaller than the native render.
  let scale = 1;
  if (options.allowUpscale) {
    scale = targetLongEdge / Math.max(trimmedWidth, trimmedHeight);
  } else if (targetLongEdge && targetLongEdge < Math.max(trimmedWidth, trimmedHeight)) {
    scale = targetLongEdge / Math.max(trimmedWidth, trimmedHeight);
  }

  const outputWidth = Math.max(1, Math.round(trimmedWidth * scale));
  const outputHeight = Math.max(1, Math.round(trimmedHeight * scale));

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;

  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) return sourceCanvas;

  // Composite background if requested (otherwise keep 100% transparent)
  if (options.background && options.background !== "transparent") {
    outputCtx.fillStyle = options.background;
    outputCtx.fillRect(0, 0, outputWidth, outputHeight);
  }

  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  outputCtx.drawImage(
    sourceCanvas,
    bounds.minX, bounds.minY, trimmedWidth, trimmedHeight,
    0, 0, outputWidth, outputHeight
  );

  return outputCanvas;
}
`;

/**
 * Creates realistic multi-part optical lens barrel assembly CAD geometry
 * when no custom shapes are supplied.
 */
const DEFAULT_CAD_SHAPES_GENERATOR = `
function createDefaultCadShapes() {
  const segments = 36;
  const outerR = 32;
  const innerR = 25;
  const height = 44;

  const hVertices = [];
  const hTriangles = [];
  const hNormals = [];
  const hEdges = [];

  for (let i = 0; i < segments; i++) {
    const t1 = (i / segments) * Math.PI * 2;
    const t2 = ((i + 1) / segments) * Math.PI * 2;
    const c1 = Math.cos(t1), s1 = Math.sin(t1);
    const c2 = Math.cos(t2), s2 = Math.sin(t2);

    const ot1 = [outerR * c1, outerR * s1, height / 2];
    const ot2 = [outerR * c2, outerR * s2, height / 2];
    const ob1 = [outerR * c1, outerR * s1, -height / 2];
    const ob2 = [outerR * c2, outerR * s2, -height / 2];

    const it1 = [innerR * c1, innerR * s1, height / 2];
    const it2 = [innerR * c2, innerR * s2, height / 2];
    const ib1 = [innerR * c1, innerR * s1, -height / 2];
    const ib2 = [innerR * c2, innerR * s2, -height / 2];

    const base = hVertices.length / 3;
    hVertices.push(...ot1, ...ot2, ...ob1, ...ob2, ...it1, ...it2, ...ib1, ...ib2);

    hTriangles.push(base, base + 1, base + 4);
    hTriangles.push(base + 1, base + 5, base + 4);
    hTriangles.push(base + 2, base + 6, base + 3);
    hTriangles.push(base + 3, base + 6, base + 7);
    hTriangles.push(base, base + 2, base + 1);
    hTriangles.push(base + 1, base + 2, base + 3);
    hTriangles.push(base + 4, base + 5, base + 6);
    hTriangles.push(base + 5, base + 7, base + 6);

    hEdges.push(...ot1, ...ot2, ...ob1, ...ob2, ...it1, ...it2, ...ib1, ...ib2);
  }

  for (let i = 0; i < hVertices.length; i += 3) {
    const x = hVertices[i];
    const y = hVertices[i + 1];
    const len = Math.hypot(x, y) || 1;
    hNormals.push(x / len, y / len, 0);
  }

  // Inner brass retainer core
  const coreOuterR = 24.5;
  const coreInnerR = 15;
  const coreH = 24;

  const cVertices = [];
  const cTriangles = [];
  const cNormals = [];
  const cEdges = [];

  for (let i = 0; i < segments; i++) {
    const t1 = (i / segments) * Math.PI * 2;
    const t2 = ((i + 1) / segments) * Math.PI * 2;
    const c1 = Math.cos(t1), s1 = Math.sin(t1);
    const c2 = Math.cos(t2), s2 = Math.sin(t2);

    const ot1 = [coreOuterR * c1, coreOuterR * s1, coreH / 2];
    const ot2 = [coreOuterR * c2, coreOuterR * s2, coreH / 2];
    const ob1 = [coreOuterR * c1, coreOuterR * s1, -coreH / 2];
    const ob2 = [coreOuterR * c2, coreOuterR * s2, -coreH / 2];

    const it1 = [coreInnerR * c1, coreInnerR * s1, coreH / 2];
    const it2 = [coreInnerR * c2, coreInnerR * s2, coreH / 2];
    const ib1 = [coreInnerR * c1, coreInnerR * s1, -coreH / 2];
    const ib2 = [coreInnerR * c2, coreInnerR * s2, -coreH / 2];

    const base = cVertices.length / 3;
    cVertices.push(...ot1, ...ot2, ...ob1, ...ob2, ...it1, ...it2, ...ib1, ...ib2);

    cTriangles.push(base, base + 1, base + 4);
    cTriangles.push(base + 1, base + 5, base + 4);
    cTriangles.push(base + 2, base + 6, base + 3);
    cTriangles.push(base + 3, base + 6, base + 7);
    cTriangles.push(base, base + 2, base + 1);
    cTriangles.push(base + 1, base + 2, base + 3);
    cTriangles.push(base + 4, base + 5, base + 6);
    cTriangles.push(base + 5, base + 7, base + 6);

    cEdges.push(...ot1, ...ot2, ...ob1, ...ob2, ...it1, ...it2, ...ib1, ...ib2);
  }

  for (let i = 0; i < cVertices.length; i += 3) {
    cNormals.push(0, 0, cVertices[i + 2] > 0 ? 1 : -1);
  }

  return {
    id: "microscope-optics-assembly",
    name: "Microscope Objective Assembly",
    parts: [
      {
        id: "/microscope-optics-assembly/housing",
        name: "Optical Housing",
        color: "#334155",
        state: [1, 1],
        shape: {
          vertices: hVertices,
          triangles: hTriangles,
          normals: hNormals,
          edges: hEdges,
          obj_vertices: hVertices,
          edge_types: new Array(hEdges.length / 6).fill(1),
          face_types: new Array(hTriangles.length / 3).fill(1),
        }
      },
      {
        id: "/microscope-optics-assembly/core",
        name: "Brass Retainer & Core",
        color: "#d97706",
        state: [1, 1],
        shape: {
          vertices: cVertices,
          triangles: cTriangles,
          normals: cNormals,
          edges: cEdges,
          obj_vertices: cVertices,
          edge_types: new Array(cEdges.length / 6).fill(1),
          face_types: new Array(cTriangles.length / 3).fill(1),
        }
      }
    ]
  };
}
`;

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

let cachedClientBundleCode: string | null = null;

function getClientBundleCode(): string {
  if (cachedClientBundleCode) return cachedClientBundleCode;

  const candidates = [
    // Pre-built in dist
    path.resolve(CURRENT_DIR, "lib", "clientBundle.min.js"),
    path.resolve(CURRENT_DIR, "clientBundle.min.js"),
    path.resolve(CURRENT_DIR, "../../dist/thumbnails/lib/clientBundle.min.js"),
    path.resolve(process.cwd(), "dist/thumbnails/lib/clientBundle.min.js"),
    path.resolve(process.cwd(), "packages/ducjs/dist/thumbnails/lib/clientBundle.min.js"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      cachedClientBundleCode = fs.readFileSync(c, "utf8");
      return cachedClientBundleCode;
    }
  }

  // If in Bun dev/test environment and bundle not on disk, bundle clientEntry on the fly
  if (typeof Bun !== "undefined" && typeof (Bun as any).spawnSync === "function") {
    try {
      const entryCandidates = [
        path.resolve(CURRENT_DIR, "lib", "clientEntry.ts"),
        path.resolve(CURRENT_DIR, "clientEntry.ts"),
        path.resolve(process.cwd(), "packages/ducjs/src/thumbnails/lib/clientEntry.ts"),
        path.resolve(process.cwd(), "src/thumbnails/lib/clientEntry.ts"),
      ];
      for (const entryPath of entryCandidates) {
        if (fs.existsSync(entryPath)) {
          const proc = (Bun as any).spawnSync([
            "bun",
            "build",
            entryPath,
            "--target",
            "browser",
            "--minify",
          ]);
          if (proc.success) {
            const code = proc.stdout.toString("utf8");
            cachedClientBundleCode = code;
            return code;
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  throw new Error("Missing thumbnail client bundle. Build ducjs and package dist/thumbnails/lib/clientBundle.min.js alongside the thumbnail handler.");
}

/**
 * Generates an HTML document that renders 3D CAD shapes using three-cad-viewer,
 * strictly matching the app's offscreen-model-thumbnail.ts and thumbnail-capture.ts.
 */
export function buildCadViewerHtml(
  shapes: unknown,
  config: ResolvedModelViewConfig,
): string {
  const shapesJson = safeJsonStringify(shapes ?? null);
  const configJson = safeJsonStringify(config);
  const importMapJson = getImportMapJson();
  const clientBundleCode = getClientBundleCode();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${config.background === "transparent" ? "transparent" : config.background};
    }
    #viewer-container {
      width: ${config.width || 1200}px;
      height: ${config.height || 900}px;
      position: relative;
    }
    canvas {
      display: block;
    }
  </style>
  <script type="importmap">
${importMapJson}
  </script>
  <script>
    window.__thumbnailReady = false;
    window.__thumbnailError = null;
    window.onerror = function(msg, url, line) {
      window.__thumbnailError = "Global page error: " + msg + " at " + line;
      window.__thumbnailReady = true;
    };
    window.onunhandledrejection = function(e) {
      window.__thumbnailError = "Unhandled rejection: " + (e.reason ? (e.reason.stack || e.reason) : e);
      window.__thumbnailReady = true;
    };
  </script>
</head>
<body>
  <div id="viewer-container"></div>
  <script id="shapes-data" type="application/json">
${shapesJson}
  </script>
  <script id="config-data" type="application/json">
${configJson}
  </script>
  <script type="module">
    ${clientBundleCode}

    try {
      const rawShapes = JSON.parse(document.getElementById("shapes-data").textContent || "null");
      const cfg = JSON.parse(document.getElementById("config-data").textContent || "{}");

      // Construct Viewer3DState from resolved view config
      const viewerState = {
        camera: {
          control: "orbit",
          ortho: cfg.camera.ortho !== false,
          up: cfg.camera.up || "Z",
          position: cfg.camera.position,
          quaternion: cfg.camera.quaternion,
          target: cfg.camera.target,
          zoom: cfg.camera.zoom || 1,
          panSpeed: 1,
          rotateSpeed: 1,
          zoomSpeed: 1,
          holroyd: false,
        },
        display: cfg.display,
        material: cfg.material,
        clipping: cfg.clipping,
        explode: cfg.explode,
        zebra: cfg.zebra,
      };

      const requestedLongEdge = Math.max(cfg.targetLongEdge || 0, cfg.width || 0, cfg.height || 0, 1200);
      const aspect = (cfg.width && cfg.height) ? (cfg.width / cfg.height) : (4 / 3);
      let renderWidth = requestedLongEdge;
      let renderHeight = Math.round(requestedLongEdge / aspect);
      if (aspect < 1) {
        renderHeight = requestedLongEdge;
        renderWidth = Math.round(requestedLongEdge * aspect);
      }

      console.log("[Thumbnail] Data parsed. Starting renderOffscreenModelThumbnail...");
      const result = await window.renderOffscreenModelThumbnail({
        shapes: rawShapes,
        viewerState,
        hasExplicitCamera: cfg.hasExplicitCamera,
        width: renderWidth,
        height: renderHeight,
        targetLongEdge: requestedLongEdge,
        trimTransparentBounds: cfg.trimTransparentBounds,
        trimPaddingPx: cfg.trimPaddingPx !== undefined ? cfg.trimPaddingPx : 2,
        background: cfg.background,
        format: cfg.format || "png",
      });
      console.log("[Thumbnail] renderOffscreenModelThumbnail finished. Result:", Boolean(result));

      if (!result) {
        throw new Error("renderOffscreenModelThumbnail returned null");
      }

      let binary = "";
      const bytes = result.data;
      const len = bytes.byteLength;
      const chunkSize = 0x8000;
      for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
      }
      const b64 = btoa(binary);

      const img = new Image();
      img.src = "data:image/" + (cfg.format || "png") + ";base64," + b64;
      document.body.innerHTML = "";
      document.body.style.width = result.width + "px";
      document.body.style.height = result.height + "px";
      if (cfg.background && cfg.background !== "transparent") {
        document.body.style.background = cfg.background;
      } else {
        document.body.style.background = "transparent";
      }
      document.body.appendChild(img);

      window.__thumbnailBase64 = b64;
      window.__thumbnailWidth = result.width;
      window.__thumbnailHeight = result.height;
      window.__thumbnailRenderer = result.glRenderer || "Unknown";
      window.__thumbnailIsGpu = Boolean(result.isGpu);
      window.__thumbnailReady = true;
    } catch (err) {
      window.__thumbnailError = err instanceof Error ? err.stack || err.message : String(err);
      window.__thumbnailReady = true;
    }
  </script>
</body>
</html>`;
}
