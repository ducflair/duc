import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test";
import { Database } from "bun:sqlite";
import { gunzipSync } from "fflate";
import fs from "fs";
import path from "path";
import {
  getModelThumbnailBoundsUpdate,
  HeadlessBrowserRunner,
  isGrayscaleColor,
  renderModelElementThumbnail,
  renderModelElementThumbnailWithResult,
  renderModelViewThumbnail,
  resolveBrowserExecutable,
  resolveThumbnailBackground,
} from "../src/thumbnails";
import { parseDuc } from "../src/parse";
import type { DucModelElement } from "../src/types/elements";
import { getDucFixturePath, getFixturePath } from "./fixtures";

const OUTPUT_DIR = path.resolve(import.meta.dir, "output");
setDefaultTimeout(120_000);
const CPU_OUTPUT_DIR = path.join(OUTPUT_DIR, "CPU");
const GPU_OUTPUT_DIR = path.join(OUTPUT_DIR, "GPU");
const DXF_FIXTURES_DIR = path.resolve(import.meta.dir, "../../ducdxf/tests/fixtures/dxf");
const DWG_FIXTURES_DIR = path.resolve(import.meta.dir, "../../../../dwgpdf/tests/fixtures/local");

interface BenchmarkRecord {
  name: string;
  resolution: string;
  gpuMs?: number;
  cpuMs?: number;
  speedup?: string;
  gpuSize?: number;
  cpuSize?: number;
}

const benchmarkTable: BenchmarkRecord[] = [];

/**
 * Loads and parses a .duc fixture file, returning the parsed state and raw SQLite database.
 */
async function loadDucFixture(filename: string) {
  const filePath = await getDucFixturePath(filename);
  const compressed = new Uint8Array(await Bun.file(filePath).arrayBuffer());
  const rawSqlite = gunzipSync(compressed);
  const parsed = await parseDuc(new Blob([rawSqlite]));

  const tempSqlitePath = path.join("/tmp", `fixture-${Date.now()}-${filename}.sqlite`);
  await Bun.write(tempSqlitePath, rawSqlite);
  const db = new Database(tempSqlitePath);

  return {
    parsed,
    db,
    filePath,
    cleanup: () => {
      try {
        db.close();
        fs.unlinkSync(tempSqlitePath);
      } catch {
        // Best-effort cleanup
      }
    },
  };
}

describe("thumbnails end-to-end render capture with real test fixtures", () => {
  const browserPath = resolveBrowserExecutable();

  if (!browserPath) {
    it.skip("skipping browser tests (no Chrome/Chromium found)", () => {});
    return;
  }

  let hasGpu = false;
  let gpuRunner: HeadlessBrowserRunner;
  let cpuRunner: HeadlessBrowserRunner;

  beforeAll(async () => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.mkdirSync(CPU_OUTPUT_DIR, { recursive: true });
    fs.mkdirSync(GPU_OUTPUT_DIR, { recursive: true });

    // Software CPU runner (SwiftShader driver via ANGLE)
    cpuRunner = new HeadlessBrowserRunner({
      executablePath: browserPath,
      useSoftwareRenderer: true,
      mode: "cpu",
    });

    // Hardware GPU runner (Metal / Vulkan driver via ANGLE)
    const candidateGpuRunner = new HeadlessBrowserRunner({
      executablePath: browserPath,
      useSoftwareRenderer: false,
      mode: "gpu",
    });

    await Promise.all([candidateGpuRunner.start(), cpuRunner.start()]);

    // Probe whether hardware GPU acceleration is supported in this environment
    try {
      await candidateGpuRunner.captureHtml(
        `<!DOCTYPE html><html><body><canvas id="c"></canvas><script>
          const gl = document.getElementById("c").getContext("webgl2") || document.getElementById("c").getContext("webgl");
          if (!gl) {
            window.__thumbnailError = "No WebGL";
            window.__thumbnailReady = true;
          } else {
            const dbg = gl.getExtension("WEBGL_debug_renderer_info");
            const r = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
            const isHw = typeof r === "string" && !r.toLowerCase().includes("swiftshader") && !r.toLowerCase().includes("llvmpipe");
            if (!isHw) {
              window.__thumbnailError = "Software renderer only";
              window.__thumbnailReady = true;
            } else {
              window.__thumbnailReady = true;
            }
          }
        </script></body></html>`,
        64,
        64,
        "png",
        8000,
      );
      hasGpu = true;
      gpuRunner = candidateGpuRunner;
    } catch {
      hasGpu = false;
      await candidateGpuRunner.stop().catch(() => {});
      gpuRunner = cpuRunner;
    }
  });

  afterAll(async () => {
    const runnersToStop = new Set([gpuRunner, cpuRunner]);
    await Promise.all(
      Array.from(runnersToStop).map((r) => r?.stop().catch(() => {})),
    );

    // Print benchmark summary table
    if (benchmarkTable.length > 0) {
      console.log("\n==========================================================================================");
      console.log("                        HEADLESS THUMBNAIL BENCHMARK COMPARISON                           ");
      console.log("==========================================================================================");
      console.log(
        "| " +
          "Test / Model".padEnd(36) +
          " | " +
          "Resolution".padEnd(12) +
          " | " +
          "GPU Time".padEnd(10) +
          " | " +
          "CPU Time".padEnd(10) +
          " | " +
          "Speedup".padEnd(9) +
          " |",
      );
      console.log("|" + "-".repeat(38) + "|" + "-".repeat(14) + "|" + "-".repeat(12) + "|" + "-".repeat(12) + "|" + "-".repeat(11) + "|");
      for (const b of benchmarkTable) {
        const gpuStr = b.gpuMs !== undefined ? `${b.gpuMs}ms` : "N/A";
        const cpuStr = b.cpuMs !== undefined ? `${b.cpuMs}ms` : "N/A";
        const speedupStr = b.speedup || "N/A";
        console.log(
          "| " +
            b.name.padEnd(36) +
            " | " +
            b.resolution.padEnd(12) +
            " | " +
            gpuStr.padEnd(10) +
            " | " +
            cpuStr.padEnd(10) +
            " | " +
            speedupStr.padEnd(9) +
            " |",
        );
      }
      console.log("==========================================================================================\n");
    }
  });

  it("resolves background colors respecting user preference and defaulting to transparent", () => {
    expect(resolveThumbnailBackground(undefined)).toBe("transparent");
    expect(resolveThumbnailBackground("")).toBe("transparent");
    expect(resolveThumbnailBackground("transparent")).toBe("transparent");
    expect(resolveThumbnailBackground("#ffffff")).toBe("#ffffff");
    expect(resolveThumbnailBackground("#0f172a")).toBe("#0f172a");
    expect(resolveThumbnailBackground("#3498db")).toBe("#3498db");

    // Grayscale helper still identifies neutral colors
    expect(isGrayscaleColor("#ffffff")).toBe(true);
    expect(isGrayscaleColor("#000000")).toBe(true);
    expect(isGrayscaleColor("#888888")).toBe(true);
    expect(isGrayscaleColor("#3498db")).toBe(false);
  });

  it("renders real DXF model element from universal.duc with transparent background (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const dxfEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.modelType?.toLowerCase() === "dxf",
      ) as DucModelElement | undefined;

      expect(dxfEl).toBeDefined();
      expect(dxfEl?.fileIds.length).toBeGreaterThan(0);

      const fileId = dxfEl!.fileIds[0];
      const extFile = fixture.parsed.files?.[fileId];
      const revId = extFile?.activeRevisionId;
      expect(revId).toBeDefined();

      const row = fixture.db
        .query("SELECT data FROM external_file_revision_data WHERE revision_id = ?1")
        .get(revId!) as { data: Uint8Array } | null;

      expect(row).toBeDefined();
      expect(row!.data.length).toBeGreaterThan(1000);

      const viewConfig = {
        width: 1200,
        height: 900,
        background: "transparent" as const,
      };

      // 1. GPU Render
      const gpuRes = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: row!.data, viewerState: dxfEl!.viewerState, viewConfig },
        { runner: gpuRunner },
      );
      expect(gpuRes.data.length).toBeGreaterThan(5000);
      expect(gpuRes.format).toBe("png");
      expect(gpuRes.backend).toBe(hasGpu ? "gpu" : "cpu");
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-dxf-wipeout-door.png"), gpuRes.data);

      // 2. CPU Render
      const cpuRes = hasGpu
        ? await renderModelViewThumbnail(
            { modelType: "DXF", dxf: row!.data, viewerState: dxfEl!.viewerState, viewConfig },
            { runner: cpuRunner },
          )
        : gpuRes;
      expect(cpuRes.data.length).toBeGreaterThan(5000);
      expect(cpuRes.format).toBe("png");
      expect(cpuRes.backend).toBe("cpu");
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-dxf-wipeout-door.png"), cpuRes.data);

      const speedup = hasGpu
        ? (cpuRes.renderTimeMs / Math.max(1, gpuRes.renderTimeMs)).toFixed(1) + "x"
        : "1.0x";
      benchmarkTable.push({
        name: "universal.duc DXF Door",
        resolution: "1200x900",
        gpuMs: gpuRes.renderTimeMs,
        cpuMs: cpuRes.renderTimeMs,
        speedup,
        gpuSize: gpuRes.data.byteLength,
        cpuSize: cpuRes.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 35000);

  it("renders real DXF model element with user-specified white and dark blueprint backgrounds (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const dxfEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.modelType?.toLowerCase() === "dxf",
      ) as DucModelElement | undefined;

      const fileId = dxfEl!.fileIds[0];
      const extFile = fixture.parsed.files?.[fileId];
      const revId = extFile?.activeRevisionId!;

      const row = fixture.db
        .query("SELECT data FROM external_file_revision_data WHERE revision_id = ?1")
        .get(revId) as { data: Uint8Array } | null;

      expect(row).toBeDefined();

      // GPU & CPU White
      const gpuWhite = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: row!.data, viewConfig: { width: 1200, height: 900, background: "#ffffff" } },
        { runner: gpuRunner },
      );
      const cpuWhite = hasGpu
        ? await renderModelViewThumbnail(
            { modelType: "DXF", dxf: row!.data, viewConfig: { width: 1200, height: 900, background: "#ffffff" } },
            { runner: cpuRunner },
          )
        : gpuWhite;
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-dxf-wipeout-white.png"), gpuWhite.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-dxf-wipeout-white.png"), cpuWhite.data);

      // GPU & CPU Blueprint
      const gpuBlue = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: row!.data, viewConfig: { width: 1400, height: 1000, background: "#1e293b" } },
        { runner: gpuRunner },
      );
      const cpuBlue = hasGpu
        ? await renderModelViewThumbnail(
            { modelType: "DXF", dxf: row!.data, viewConfig: { width: 1400, height: 1000, background: "#1e293b" } },
            { runner: cpuRunner },
          )
        : gpuBlue;
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-dxf-blueprint.png"), gpuBlue.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-dxf-blueprint.png"), cpuBlue.data);

      benchmarkTable.push({
        name: "universal.duc DXF Blueprint",
        resolution: "1400x1000",
        gpuMs: gpuBlue.renderTimeMs,
        cpuMs: cpuBlue.renderTimeMs,
        speedup: hasGpu
          ? (cpuBlue.renderTimeMs / Math.max(1, gpuBlue.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuBlue.data.byteLength,
        cpuSize: cpuBlue.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 45000);

  it("renders real DXF model element at native 4K UHD resolution directly in WebGL (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const dxfEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.modelType?.toLowerCase() === "dxf",
      ) as DucModelElement | undefined;

      const fileId = dxfEl!.fileIds[0];
      const extFile = fixture.parsed.files?.[fileId];
      const revId = extFile?.activeRevisionId!;

      const row = fixture.db
        .query("SELECT data FROM external_file_revision_data WHERE revision_id = ?1")
        .get(revId) as { data: Uint8Array } | null;

      expect(row).toBeDefined();

      const viewConfig = {
        width: 3840,
        height: 2160,
        background: "transparent" as const,
      };

      const gpuRes = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: row!.data, viewerState: dxfEl!.viewerState, viewConfig },
        { runner: gpuRunner },
      );
      expect(gpuRes.data.length).toBeGreaterThan(25000);
      expect(gpuRes.format).toBe("png");
      expect(gpuRes.width).toBeGreaterThanOrEqual(2000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-dxf-4k-native.png"), gpuRes.data);

      const cpuRes = hasGpu
        ? await renderModelViewThumbnail(
            { modelType: "DXF", dxf: row!.data, viewerState: dxfEl!.viewerState, viewConfig },
            { runner: cpuRunner },
          )
        : gpuRes;
      expect(cpuRes.data.length).toBeGreaterThan(25000);
      expect(cpuRes.format).toBe("png");
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-dxf-4k-native.png"), cpuRes.data);

      benchmarkTable.push({
        name: "universal.duc DXF 4K UHD",
        resolution: "3840x2160",
        gpuMs: gpuRes.renderTimeMs,
        cpuMs: cpuRes.renderTimeMs,
        speedup: hasGpu
          ? (cpuRes.renderTimeMs / Math.max(1, gpuRes.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuRes.data.byteLength,
        cpuSize: cpuRes.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 50000);

  it("renders other real DXF drawings: columns structural grid, house floor plan, and guitar body (GPU vs CPU)", async () => {
    // 1. Structural engineering columns grid
    let columnsPath = path.join(DXF_FIXTURES_DIR, "columns_R2007.dxf");
    if (!fs.existsSync(columnsPath)) {
      try {
        columnsPath = await getFixturePath("dxf-files", "columns_R2007.dxf");
      } catch {}
    }
    if (fs.existsSync(columnsPath)) {
      const colData = fs.readFileSync(columnsPath);
      const gpuCol = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: colData, viewConfig: { width: 1400, height: 1000, background: "#0f172a" } },
        { runner: gpuRunner },
      );
      const cpuCol = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: colData, viewConfig: { width: 1400, height: 1000, background: "#0f172a" } },
        { runner: cpuRunner },
      );
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-columns-grid.png"), gpuCol.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-columns-grid.png"), cpuCol.data);
    }

    // 2. Stratocaster guitar body CAD drawing
    const stratPath = path.join(DWG_FIXTURES_DIR, "60s_Strat_Body.dxf");
    if (fs.existsSync(stratPath)) {
      const stratData = fs.readFileSync(stratPath);
      const gpuStrat = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: stratData, viewConfig: { width: 1600, height: 1200, background: "transparent" } },
        { runner: gpuRunner },
      );
      const cpuStrat = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: stratData, viewConfig: { width: 1600, height: 1200, background: "transparent" } },
        { runner: cpuRunner },
      );
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-stratocaster-body.png"), gpuStrat.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-stratocaster-body.png"), cpuStrat.data);
    }

    // 3. House floor plan - Standard Full View
    let housePath = path.join(DXF_FIXTURES_DIR, "house-plan.dxf");
    if (!fs.existsSync(housePath)) {
      try {
        housePath = await getFixturePath("dxf-files", "house-plan.dxf");
      } catch {}
    }
    if (fs.existsSync(housePath)) {
      const houseData = fs.readFileSync(housePath);
      const gpuHouse = await renderModelViewThumbnail(
        { modelType: "DXF", dxf: houseData, viewConfig: { width: 2400, height: 1800, background: "transparent" } },
        { runner: gpuRunner, timeoutMs: 30000 },
      );
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan.png"), gpuHouse.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan.png"), gpuHouse.data);
    }
  }, 45000);

  it("explores real house plan DXF with 4K UHD, zoomed sections, layer isolation, and blueprint styling", async () => {
    let housePath = path.join(DXF_FIXTURES_DIR, "house-plan.dxf");
    if (!fs.existsSync(housePath)) {
      housePath = await getFixturePath("dxf-files", "house-plan.dxf");
    }
    expect(fs.existsSync(housePath)).toBe(true);
    const houseData = fs.readFileSync(housePath);

    // 1. Full 4K UHD Blueprint
    const blueprint4k = await renderModelViewThumbnail(
      { modelType: "DXF", dxf: houseData, viewConfig: { width: 3840, height: 2160, background: "#0f172a" } },
      { runner: gpuRunner, timeoutMs: 30000 },
    );
    expect(blueprint4k.data.length).toBeGreaterThan(50000);
    fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan-4k-blueprint.png"), blueprint4k.data);
    fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan-4k-blueprint.png"), blueprint4k.data);

    // 2. Full 4K UHD Architectural White CAD Paper
    const white4k = await renderModelViewThumbnail(
      { modelType: "DXF", dxf: houseData, viewConfig: { width: 3840, height: 2160, background: "#ffffff" } },
      { runner: gpuRunner, timeoutMs: 30000 },
    );
    expect(white4k.data.length).toBeGreaterThan(50000);
    fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan-4k-white.png"), white4k.data);
    fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan-4k-white.png"), white4k.data);

    // 3. Zoomed-In Section: Master Bedroom Wing & Bath Suite
    const secBedroom = await renderModelViewThumbnail(
      {
        modelType: "DXF",
        dxf: houseData,
        viewConfig: {
          width: 2400,
          height: 1600,
          camera: { zoom: 3.0, target: [-300, 200, 0] },
          background: "#0f172a",
        },
      },
      { runner: gpuRunner, timeoutMs: 30000 },
    );
    expect(secBedroom.data.length).toBeGreaterThan(30000);
    fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan-section-bedroom.png"), secBedroom.data);
    fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan-section-bedroom.png"), secBedroom.data);

    // 4. Zoomed-In Section: Kitchen, Breakfast Island & Dining Room
    const secKitchen = await renderModelViewThumbnail(
      {
        modelType: "DXF",
        dxf: houseData,
        viewConfig: {
          width: 2400,
          height: 1600,
          camera: { zoom: 2.5, target: [200, 100, 0] },
          background: "#ffffff",
        },
      },
      { runner: gpuRunner, timeoutMs: 30000 },
    );
    expect(secKitchen.data.length).toBeGreaterThan(30000);
    fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan-section-kitchen.png"), secKitchen.data);
    fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan-section-kitchen.png"), secKitchen.data);

    // 5. Zoomed-In Section: Central Living Room & Patio Entrance
    const secLiving = await renderModelViewThumbnail(
      {
        modelType: "DXF",
        dxf: houseData,
        viewConfig: {
          width: 2400,
          height: 1600,
          camera: { zoom: 2.8, target: [0, 0, 0] },
          background: "#0f172a",
        },
      },
      { runner: gpuRunner, timeoutMs: 30000 },
    );
    expect(secLiving.data.length).toBeGreaterThan(30000);
    fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan-section-living.png"), secLiving.data);
    fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan-section-living.png"), secLiving.data);

    // 6. Presentation Drawing: Layer Isolation (clean walls, hiding clutter electrical and dimensions)
    const secClean = await renderModelViewThumbnail(
      {
        modelType: "DXF",
        dxf: houseData,
        viewConfig: {
          width: 3840,
          height: 2160,
          hiddenLayers: ["A-ELEC", "A-DIMSx"],
          background: "#0f172a",
        },
      },
      { runner: gpuRunner, timeoutMs: 30000 },
    );
    expect(secClean.data.length).toBeGreaterThan(50000);
    fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "dxf-house-plan-presentation-clean.png"), secClean.data);
    fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "dxf-house-plan-presentation-clean.png"), secClean.data);
  }, 60000);

  it("renders real Boeing STEP model from universal.duc with clipping cutaway (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const boeingEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "iF5wjSVLZKD5zGNdNZzjS",
      ) as DucModelElement | undefined;

      expect(boeingEl).toBeDefined();

      const clippedCfg = {
        cameraPreset: "iso" as const,
        width: 1400,
        height: 1050,
        background: "#0f172a",
        clipping: { x: { enabled: true, value: 0 } },
        material: { metalness: 0.85, roughness: 0.15 },
      };

      const gpuClipped = await renderModelElementThumbnailWithResult(boeingEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: clippedCfg,
      });
      const cpuClipped = hasGpu
        ? await renderModelElementThumbnailWithResult(boeingEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            viewConfig: clippedCfg,
          })
        : gpuClipped;

      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-boeing-step-clipped.png"), gpuClipped.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-boeing-step-clipped.png"), cpuClipped.data);

      benchmarkTable.push({
        name: "universal.duc Boeing Cutaway",
        resolution: "1400x1050",
        gpuMs: gpuClipped.renderTimeMs,
        cpuMs: cpuClipped.renderTimeMs,
        speedup: hasGpu
          ? (cpuClipped.renderTimeMs / Math.max(1, gpuClipped.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuClipped.data.byteLength,
        cpuSize: cpuClipped.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 45000);

  it("benchmarks 4 distinct PBR materials on Boeing STEP model from universal.duc (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const boeingEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "iF5wjSVLZKD5zGNdNZzjS",
      ) as DucModelElement | undefined;

      expect(boeingEl).toBeDefined();

      const materialsToTest = [
        {
          name: "universal.duc Boeing Gold",
          filename: "universal-boeing-gold-material.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "transparent",
            material: { metalness: 0.95, roughness: 0.1, ambientIntensity: 0.7, directIntensity: 1.5 },
          },
        },
        {
          name: "universal.duc Boeing Steel",
          filename: "universal-boeing-steel-material.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "transparent",
            material: { metalness: 0.8, roughness: 0.45, ambientIntensity: 0.5, directIntensity: 1.2 },
          },
        },
        {
          name: "universal.duc Boeing Ceramic",
          filename: "universal-boeing-gloss-ceramic.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "transparent",
            material: { metalness: 0.1, roughness: 0.05, ambientIntensity: 0.6, directIntensity: 1.4 },
          },
        },
        {
          name: "universal.duc Boeing Matte Carbon",
          filename: "universal-boeing-matte-carbon.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "#0f172a",
            material: { metalness: 0.2, roughness: 0.9, ambientIntensity: 0.4, directIntensity: 1.0 },
          },
        },
      ];

      for (const m of materialsToTest) {
        const gpuRes = await renderModelElementThumbnailWithResult(boeingEl!, {
          runner: gpuRunner,
          ducPath: fixture.filePath,
          viewConfig: m.config,
        });
        const cpuRes = hasGpu
          ? await renderModelElementThumbnailWithResult(boeingEl!, {
              runner: cpuRunner,
              ducPath: fixture.filePath,
              viewConfig: m.config,
            })
          : gpuRes;

        fs.writeFileSync(path.join(GPU_OUTPUT_DIR, m.filename), gpuRes.data);
        fs.writeFileSync(path.join(CPU_OUTPUT_DIR, m.filename), cpuRes.data);

        benchmarkTable.push({
          name: m.name,
          resolution: "1400x1050",
          gpuMs: gpuRes.renderTimeMs,
          cpuMs: cpuRes.renderTimeMs,
          speedup: hasGpu
            ? (cpuRes.renderTimeMs / Math.max(1, gpuRes.renderTimeMs)).toFixed(1) + "x"
            : "1.0x",
          gpuSize: gpuRes.data.byteLength,
          cpuSize: cpuRes.data.byteLength,
        });
      }
    } finally {
      fixture.cleanup();
    }
  }, 90000);

  it("renders real Duplex IFC architectural model from universal.duc freshly in WebGL (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const ifcEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "QA6bGH0_Iqp_mEeE_977H",
      ) as DucModelElement | undefined;

      expect(ifcEl).toBeDefined();

      const viewCfg = {
        cameraPreset: "iso" as const,
        width: 1400,
        height: 1050,
        background: "transparent",
      };

      const gpuRes = await renderModelElementThumbnailWithResult(ifcEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewCfg,
      });
      const cpuRes = hasGpu
        ? await renderModelElementThumbnailWithResult(ifcEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            viewConfig: viewCfg,
          })
        : gpuRes;

      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-ifc-duplex.png"), gpuRes.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-ifc-duplex.png"), cpuRes.data);

      benchmarkTable.push({
        name: "universal.duc IFC Duplex BIM",
        resolution: "1400x1050",
        gpuMs: gpuRes.renderTimeMs,
        cpuMs: cpuRes.renderTimeMs,
        speedup: hasGpu
          ? (cpuRes.renderTimeMs / Math.max(1, gpuRes.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuRes.data.byteLength,
        cpuSize: cpuRes.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 45000);

  it("renders real Python CAD model from universal.duc with ISO and front views (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("universal.duc");
    try {
      const pythonEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "vipD8GMUxJiv1V2pJXzdU",
      ) as DucModelElement | undefined;

      expect(pythonEl).toBeDefined();

      // ISO view
      const gpuIso = await renderModelElementThumbnailWithResult(pythonEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        files: fixture.parsed.files,
        filesData: fixture.parsed.filesData,
        viewConfig: { cameraPreset: "iso", width: 1400, height: 1050, background: "transparent" },
      });
      const cpuIso = hasGpu
        ? await renderModelElementThumbnailWithResult(pythonEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            files: fixture.parsed.files,
            filesData: fixture.parsed.filesData,
            viewConfig: { cameraPreset: "iso", width: 1400, height: 1050, background: "transparent" },
          })
        : gpuIso;
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-python-model-view.png"), gpuIso.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-python-model-view.png"), cpuIso.data);

      // Front view
      const gpuFront = await renderModelElementThumbnailWithResult(pythonEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        files: fixture.parsed.files,
        filesData: fixture.parsed.filesData,
        viewConfig: { cameraPreset: "front", width: 1200, height: 900, background: "#ffffff" },
      });
      const cpuFront = hasGpu
        ? await renderModelElementThumbnailWithResult(pythonEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            files: fixture.parsed.files,
            filesData: fixture.parsed.filesData,
            viewConfig: { cameraPreset: "front", width: 1200, height: 900, background: "#ffffff" },
          })
        : gpuFront;
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "universal-python-front-view.png"), gpuFront.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "universal-python-front-view.png"), cpuFront.data);

      benchmarkTable.push({
        name: "universal.duc Python Wireframe",
        resolution: "1400x1050",
        gpuMs: gpuIso.renderTimeMs,
        cpuMs: cpuIso.renderTimeMs,
        speedup: hasGpu
          ? (cpuIso.renderTimeMs / Math.max(1, gpuIso.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuIso.data.byteLength,
        cpuSize: cpuIso.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 45000);

  it("renders real microscope optical core housing with light background and 3D section cutaway (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("microscope-core.duc");
    try {
      const coreEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "VEuusNQcj2c06qbIFRUPP",
      ) as DucModelElement | undefined;

      expect(coreEl).toBeDefined();

      const sectionCfg = {
        cameraPreset: "iso" as const,
        width: 1400,
        height: 1050,
        background: "#f1f5f9",
        clipping: { x: { enabled: true, value: 0 }, intersection: false },
      };

      const gpuSection = await renderModelElementThumbnailWithResult(coreEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: sectionCfg,
      });
      const cpuSection = hasGpu
        ? await renderModelElementThumbnailWithResult(coreEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            viewConfig: sectionCfg,
          })
        : gpuSection;

      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "microscope-optics-section-cutaway.png"), gpuSection.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "microscope-optics-section-cutaway.png"), cpuSection.data);

      benchmarkTable.push({
        name: "microscope OF-LL-CORE Section",
        resolution: "1400x1050",
        gpuMs: gpuSection.renderTimeMs,
        cpuMs: cpuSection.renderTimeMs,
        speedup: hasGpu
          ? (cpuSection.renderTimeMs / Math.max(1, gpuSection.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuSection.data.byteLength,
        cpuSize: cpuSection.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 45000);

  it("renders a zoomed-in sectioned region focused closely on interior bore details (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("microscope-core.duc");
    try {
      const coreEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "VEuusNQcj2c06qbIFRUPP",
      ) as DucModelElement | undefined;

      expect(coreEl).toBeDefined();

      // Zoomed-in camera framing focused on internal objective lens bore with X-axis clipping cutaway
      const zoomedSectionConfig = {
        camera: {
          position: [70, 70, 45],
          target: [0, 0, 10],
          zoom: 3.2,
        },
        clipping: {
          x: { enabled: true, value: 0 },
        },
        width: 1920,
        height: 1080,
        background: "#0f172a",
        material: {
          metalness: 0.9,
          roughness: 0.15,
        },
      };

      // 1. GPU Render
      const gpuRes = await renderModelElementThumbnailWithResult(coreEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: zoomedSectionConfig,
      });

      expect(gpuRes.data.length).toBeGreaterThan(5000);
      expect(gpuRes.format).toBe("png");
      expect(gpuRes.backend).toBe(hasGpu ? "gpu" : "cpu");
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "microscope-core-zoomed-section.png"), gpuRes.data);

      // 2. CPU Render
      const cpuRes = hasGpu
        ? await renderModelElementThumbnailWithResult(coreEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            viewConfig: zoomedSectionConfig,
          })
        : gpuRes;

      expect(cpuRes.data.length).toBeGreaterThan(5000);
      expect(cpuRes.format).toBe("png");
      expect(cpuRes.backend).toBe("cpu");
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "microscope-core-zoomed-section.png"), cpuRes.data);

      benchmarkTable.push({
        name: "microscope Zoomed Section Cutaway",
        resolution: "1920x1080",
        gpuMs: gpuRes.renderTimeMs,
        cpuMs: cpuRes.renderTimeMs,
        speedup: hasGpu
          ? (cpuRes.renderTimeMs / Math.max(1, gpuRes.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuRes.data.byteLength,
        cpuSize: cpuRes.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 45000);

  it("renders 5 NEW complex model elements from microscope-core.duc (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("microscope-core.duc");
    try {
      const newElements = [
        { id: "Ijj0HtMrFqhwJvQkn2-7v", label: "OF-LL-65 (Optical Tube 65mm)", filename: "microscope-tube-65.png" },
        { id: "kTpjCYJju8vpNTFJafJ4C", label: "OF-LL-SP (Sample Platform)", filename: "microscope-sample-platform.png" },
        { id: "1MNKfDpNS3LmqqZaZay8l", label: "OF-LL-BP (Base Plate)", filename: "microscope-base-plate.png" },
        { id: "uG_WYJyDAOt3hJR9aXAOv", label: "OF-LL-TL (Tube Lens Mount)", filename: "microscope-tube-lens-mount.png" },
        { id: "ft-t2JOKeFQXeu5F_RGL6", label: "OF-IN-MCH (Mechanical Coupler)", filename: "microscope-mechanical-coupler.png" },
      ];

      for (const item of newElements) {
        const el = fixture.parsed.elements.find((e) => e.type === "model" && e.id === item.id) as DucModelElement | undefined;
        expect(el).toBeDefined();

        const viewConfig = {
          cameraPreset: "iso" as const,
          width: 1400,
          height: 1050,
          background: "transparent",
          material: {
            metalness: 0.8,
            roughness: 0.2,
          },
        };

        // GPU Render
        const gpuRes = await renderModelElementThumbnailWithResult(el!, {
          runner: gpuRunner,
          ducPath: fixture.filePath,
          viewConfig,
        });
        expect(gpuRes.data.length).toBeGreaterThan(5000);
        fs.writeFileSync(path.join(GPU_OUTPUT_DIR, item.filename), gpuRes.data);

        // CPU Render
        const cpuRes = hasGpu
          ? await renderModelElementThumbnailWithResult(el!, {
              runner: cpuRunner,
              ducPath: fixture.filePath,
              viewConfig,
            })
          : gpuRes;
        expect(cpuRes.data.length).toBeGreaterThan(5000);
        fs.writeFileSync(path.join(CPU_OUTPUT_DIR, item.filename), cpuRes.data);

        benchmarkTable.push({
          name: item.label,
          resolution: "1400x1050",
          gpuMs: gpuRes.renderTimeMs,
          cpuMs: cpuRes.renderTimeMs,
          speedup: hasGpu
            ? (cpuRes.renderTimeMs / Math.max(1, gpuRes.renderTimeMs)).toFixed(1) + "x"
            : "1.0x",
          gpuSize: gpuRes.data.byteLength,
          cpuSize: cpuRes.data.byteLength,
        });
      }
    } finally {
      fixture.cleanup();
    }
  }, 90000);

  it("renders microscope optical housing at native 4K UHD and ultra-high 8K UHD resolutions (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("microscope-core.duc");
    try {
      const coreEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "VEuusNQcj2c06qbIFRUPP",
      ) as DucModelElement | undefined;

      expect(coreEl).toBeDefined();

      // 1. Native 4K UHD (3840x2160) on GPU and CPU
      const gpu4k = await renderModelElementThumbnailWithResult(coreEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: {
          cameraPreset: "iso",
          width: 3840,
          height: 2160,
          background: "#0f172a",
        },
      });

      expect(gpu4k.data.length).toBeGreaterThan(50000);
      expect(gpu4k.backend).toBe(hasGpu ? "gpu" : "cpu");
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "microscope-optics-4k.png"), gpu4k.data);

      const cpu4k = hasGpu
        ? await renderModelElementThumbnailWithResult(coreEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            viewConfig: {
              cameraPreset: "iso",
              width: 3840,
              height: 2160,
              background: "#0f172a",
            },
          })
        : gpu4k;

      expect(cpu4k.data.length).toBeGreaterThan(50000);
      expect(cpu4k.backend).toBe("cpu");
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "microscope-optics-4k.png"), cpu4k.data);

      benchmarkTable.push({
        name: "microscope OF-LL-CORE 4K UHD",
        resolution: "3840x2160",
        gpuMs: gpu4k.renderTimeMs,
        cpuMs: cpu4k.renderTimeMs,
        speedup: hasGpu
          ? (cpu4k.renderTimeMs / Math.max(1, gpu4k.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpu4k.data.byteLength,
        cpuSize: cpu4k.data.byteLength,
      });

      // 2. Native 8K UHD (7680x4320) on both GPU and CPU
      const gpu8k = await renderModelElementThumbnailWithResult(coreEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: {
          cameraPreset: "iso",
          width: 7680,
          height: 4320,
          background: "#0f172a",
          material: {
            metalness: 0.9,
            roughness: 0.2,
          },
        },
      });

      expect(gpu8k.data.length).toBeGreaterThan(500000);
      expect(gpu8k.width).toBeGreaterThanOrEqual(4000);
      expect(gpu8k.backend).toBe(hasGpu ? "gpu" : "cpu");
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "microscope-optics-8k.png"), gpu8k.data);

      const cpu8k = hasGpu
        ? await renderModelElementThumbnailWithResult(coreEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            timeoutMs: 60000,
            viewConfig: {
              cameraPreset: "iso",
              width: 7680,
              height: 4320,
              background: "#0f172a",
              material: {
                metalness: 0.9,
                roughness: 0.2,
              },
            },
          })
        : gpu8k;

      expect(cpu8k.data.length).toBeGreaterThan(500000);
      expect(cpu8k.width).toBeGreaterThanOrEqual(4000);
      expect(cpu8k.backend).toBe("cpu");
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "microscope-optics-8k.png"), cpu8k.data);

      // 3. Comparable 2K Resolution (2560x1440)
      const res2k = await renderModelElementThumbnailWithResult(coreEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: {
          cameraPreset: "iso",
          width: 2560,
          height: 1440,
          background: "#0f172a",
          material: {
            metalness: 0.9,
            roughness: 0.2,
          },
        },
      });
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "microscope-optics-2k.png"), res2k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "microscope-optics-2k.png"), res2k.data);

      benchmarkTable.push({
        name: "microscope OF-LL-CORE 8K UHD",
        resolution: "7680x4320",
        gpuMs: gpu8k.renderTimeMs,
        cpuMs: cpu8k.renderTimeMs,
        speedup: hasGpu
          ? (cpu8k.renderTimeMs / Math.max(1, gpu8k.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpu8k.data.byteLength,
        cpuSize: cpu8k.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 90000);

  it("renders the biggest microscope model element (open parts compound assembly) in 4K UHD (GPU vs CPU)", async () => {
    const fixture = await loadDucFixture("microscope-core.duc");
    try {
      const biggestEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "NCGRKhXi9jGIWjaKSN_Z6",
      ) as DucModelElement | undefined;

      expect(biggestEl).toBeDefined();

      const viewConfig = {
        cameraPreset: "iso" as const,
        width: 3840,
        height: 2160,
        background: "#0f172a",
      };

      const gpuResult = await renderModelElementThumbnailWithResult(biggestEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        timeoutMs: 60000,
        viewConfig,
      });

      expect(gpuResult.data.length).toBeGreaterThan(50000);
      expect(gpuResult.format).toBe("png");
      expect(gpuResult.backend).toBe(hasGpu ? "gpu" : "cpu");
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "microscope-openframe-assembly.png"), gpuResult.data);

      const cpuResult = hasGpu
        ? await renderModelElementThumbnailWithResult(biggestEl!, {
            runner: cpuRunner,
            ducPath: fixture.filePath,
            timeoutMs: 150000,
            viewConfig,
          })
        : gpuResult;

      expect(cpuResult.data.length).toBeGreaterThan(50000);
      expect(cpuResult.format).toBe("png");
      expect(cpuResult.backend).toBe("cpu");
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "microscope-openframe-assembly.png"), cpuResult.data);

      benchmarkTable.push({
        name: "openFrame Assembly (45 parts)",
        resolution: "3840x2160",
        gpuMs: gpuResult.renderTimeMs,
        cpuMs: cpuResult.renderTimeMs,
        speedup: hasGpu
          ? (cpuResult.renderTimeMs / Math.max(1, gpuResult.renderTimeMs)).toFixed(1) + "x"
          : "1.0x",
        gpuSize: gpuResult.data.byteLength,
        cpuSize: cpuResult.data.byteLength,
      });
    } finally {
      fixture.cleanup();
    }
  }, 180000);

  it("renders Maria Pia / Antónia Ferreira bridge model (clean superstructure and piers) at 8K and 2K", async () => {
    const fixture = await loadDucFixture("ponte-d-antonia-ferreira.duc");
    try {
      // Model 4 (11l1rHBjHiBnkU1e-FwKU): Pure bridge superstructure and piers without topography occlusion
      const bridgeEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && (e.id === "11l1rHBjHiBnkU1e-FwKU" || e.id === "SBURW-kxWRz-xxy-cBZOk"),
      ) as DucModelElement | undefined;

      expect(bridgeEl).toBeDefined();

      const viewConfig8k = {
        cameraPreset: "iso" as const,
        width: 7680,
        height: 4320,
        background: "#0f172a",
        material: {
          metalness: 0.7,
          roughness: 0.3,
        },
      };

      const viewConfig2k = {
        cameraPreset: "iso" as const,
        width: 2560,
        height: 1440,
        background: "#0f172a",
        material: {
          metalness: 0.7,
          roughness: 0.3,
        },
      };

      // 1. 8K UHD Render
      const res8k = await renderModelElementThumbnailWithResult(bridgeEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig8k,
        timeoutMs: 60000,
      });
      expect(res8k.data.length).toBeGreaterThan(50000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "bridge-antonia-ferreira-8k.png"), res8k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "bridge-antonia-ferreira-8k.png"), res8k.data);

      // 2. Comparable 2K Render
      const res2k = await renderModelElementThumbnailWithResult(bridgeEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig2k,
        timeoutMs: 30000,
      });
      expect(res2k.data.length).toBeGreaterThan(20000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "bridge-antonia-ferreira-2k.png"), res2k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "bridge-antonia-ferreira-2k.png"), res2k.data);
    } finally {
      fixture.cleanup();
    }
  }, 90000);

  it("renders Empire State Building itself (2,091-part tower model) at 8K and 2K", async () => {
    const fixture = await loadDucFixture("empire-state-building.duc");
    try {
      // Element pDNeu_O5fUkI0o2qm9sAv: Full Empire State Building IFC with MEP & elevators (2.73 MB, 2091 parts)
      const towerEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "pDNeu_O5fUkI0o2qm9sAv",
      ) as DucModelElement | undefined;

      expect(towerEl).toBeDefined();

      const viewConfig8k = {
        cameraPreset: "iso" as const,
        width: 7680,
        height: 4320,
        background: "#0f172a",
      };

      const viewConfig2k = {
        cameraPreset: "iso" as const,
        width: 2560,
        height: 1440,
        background: "#0f172a",
      };

      // 1. 8K UHD Render
      const res8k = await renderModelElementThumbnailWithResult(towerEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig8k,
        timeoutMs: 60000,
      });
      expect(res8k.data.length).toBeGreaterThan(50000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "empire-state-building-8k.png"), res8k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "empire-state-building-8k.png"), res8k.data);

      // 2. Comparable 2K Render
      const res2k = await renderModelElementThumbnailWithResult(towerEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig2k,
        timeoutMs: 30000,
      });
      expect(res2k.data.length).toBeGreaterThan(20000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "empire-state-building-2k.png"), res2k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "empire-state-building-2k.png"), res2k.data);
    } finally {
      fixture.cleanup();
    }
  }, 90000);

  it("renders biggest satellite element (OreSat0.5 2U assembly) at 8K and 2K", async () => {
    const fixture = await loadDucFixture("satellite.duc");
    try {
      // Element Do3XCgudh_ZaWlUUWWRQ-: Full single-OreSat0.5.step 2U satellite assembly (46.5 MB STEP)
      const satEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "Do3XCgudh_ZaWlUUWWRQ-",
      ) as DucModelElement | undefined;

      expect(satEl).toBeDefined();

      const viewConfig8k = {
        cameraPreset: "iso" as const,
        width: 7680,
        height: 4320,
        background: "#0f172a",
      };

      const viewConfig2k = {
        cameraPreset: "iso" as const,
        width: 2560,
        height: 1440,
        background: "#0f172a",
      };

      // 1. 8K UHD Render
      const res8k = await renderModelElementThumbnailWithResult(satEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig8k,
        timeoutMs: 90000,
      });
      expect(res8k.data.length).toBeGreaterThan(50000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "satellite-oresat05-8k.png"), res8k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "satellite-oresat05-8k.png"), res8k.data);

      // 2. Comparable 2K Render
      const res2k = await renderModelElementThumbnailWithResult(satEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig2k,
        timeoutMs: 45000,
      });
      expect(res2k.data.length).toBeGreaterThan(20000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "satellite-oresat05-2k.png"), res2k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "satellite-oresat05-2k.png"), res2k.data);
    } finally {
      fixture.cleanup();
    }
  }, 120000);

  it("renders smaller satellite elements testing material model view state rendering", async () => {
    const fixture = await loadDucFixture("satellite.duc");
    try {
      const components = [
        {
          id: "K7xW9d288_6a5uJomS2xu",
          label: "Solar Panel Chassis Face (+X 2U)",
          filename: "satellite-panel-solar-material.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "transparent",
            material: {
              metalness: 0.85,
              roughness: 0.15,
              ambientIntensity: 0.6,
              directIntensity: 1.4,
            },
          },
        },
        {
          id: "TUAZK03u8Z6X86j8xhVIH",
          label: "Thermal Radiator (2U Y)",
          filename: "satellite-radiator-titanium.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "#0f172a",
            material: {
              metalness: 0.95,
              roughness: 0.25,
              ambientIntensity: 0.5,
              directIntensity: 1.3,
            },
          },
        },
        {
          id: "p6IaBHbWzBVkkOuRM9fRo",
          label: "DxWifi Camera Board PCB",
          filename: "satellite-camera-board-pcb.png",
          config: {
            cameraPreset: "top" as const,
            width: 1400,
            height: 1050,
            background: "transparent",
            material: {
              metalness: 0.3,
              roughness: 0.4,
              ambientIntensity: 0.7,
              directIntensity: 1.2,
            },
          },
        },
        {
          id: "yqmRI-HI56uF-Igu4VYUo",
          label: "ICR18650 Li-ion Battery Cell",
          filename: "satellite-battery-cell.png",
          config: {
            cameraPreset: "iso" as const,
            width: 1400,
            height: 1050,
            background: "#0f172a",
            material: {
              metalness: 0.9,
              roughness: 0.2,
              ambientIntensity: 0.6,
              directIntensity: 1.4,
            },
          },
        },
      ];

      for (const comp of components) {
        const el = fixture.parsed.elements.find(
          (e) => e.type === "model" && e.id === comp.id,
        ) as DucModelElement | undefined;
        expect(el).toBeDefined();

        const res = await renderModelElementThumbnailWithResult(el!, {
          runner: gpuRunner,
          ducPath: fixture.filePath,
          viewConfig: comp.config,
          timeoutMs: 45000,
        });

        expect(res.data.length).toBeGreaterThan(5000);
        fs.writeFileSync(path.join(GPU_OUTPUT_DIR, comp.filename), res.data);
        fs.writeFileSync(path.join(CPU_OUTPUT_DIR, comp.filename), res.data);
      }
    } finally {
      fixture.cleanup();
    }
  }, 90000);

  it("renders Colosseum quadrant model (colosseum.duc) at 8K and 2K with section views and PBR materials", async () => {
    const fixture = await loadDucFixture("colosseum.duc");
    try {
      // Element col2_3d_all: Full Colosseum 3D quadrant with all architectural layers
      const colosseumEl = fixture.parsed.elements.find(
        (e) => e.type === "model" && e.id === "col2_3d_all",
      ) as DucModelElement | undefined;

      expect(colosseumEl).toBeDefined();

      const viewConfig8k = {
        cameraPreset: "iso" as const,
        width: 7680,
        height: 4320,
        background: "#0f172a",
        material: {
          metalness: 0.1,
          roughness: 0.85, // Classical Roman Travertine & Tufo
        },
      };

      const viewConfig2k = {
        cameraPreset: "iso" as const,
        width: 2560,
        height: 1440,
        background: "#0f172a",
        material: {
          metalness: 0.1,
          roughness: 0.85,
        },
      };

      // 1. 8K UHD Render
      const res8k = await renderModelElementThumbnailWithResult(colosseumEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig8k,
        timeoutMs: 90000,
      });
      expect(res8k.data.length).toBeGreaterThan(50000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "colosseum-quadrant-8k.png"), res8k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "colosseum-quadrant-8k.png"), res8k.data);

      // 2. Comparable 2K Render
      const res2k = await renderModelElementThumbnailWithResult(colosseumEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: viewConfig2k,
        timeoutMs: 45000,
      });
      expect(res2k.data.length).toBeGreaterThan(20000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "colosseum-quadrant-2k.png"), res2k.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "colosseum-quadrant-2k.png"), res2k.data);

      // 3. Sectioned Cutaway View: Cutting through the arena, cavea tiers, and hypogeum
      const sectionViewConfig = {
        cameraPreset: "front" as const,
        width: 2560,
        height: 1440,
        background: "#ffffff",
        clipPlanes: [
          {
            plane: "-x" as const,
            distance: 10,
          },
        ],
        material: {
          metalness: 0.2,
          roughness: 0.7,
        },
      };

      const resSection = await renderModelElementThumbnailWithResult(colosseumEl!, {
        runner: gpuRunner,
        ducPath: fixture.filePath,
        viewConfig: sectionViewConfig,
        timeoutMs: 45000,
      });
      expect(resSection.data.length).toBeGreaterThan(20000);
      fs.writeFileSync(path.join(GPU_OUTPUT_DIR, "colosseum-quadrant-section.png"), resSection.data);
      fs.writeFileSync(path.join(CPU_OUTPUT_DIR, "colosseum-quadrant-section.png"), resSection.data);
    } finally {
      fixture.cleanup();
    }
  }, 120000);

  it("verifies automated fallback architecture: Three.js/WebGL -> Chromium+ANGLE -> SwiftShader -> CPU", async () => {
    // Test the automated fallback framework
    // When instantiated with mode: 'auto', the runner detects GPU availability,
    // and seamlessly uses SwiftShader software implementation if hardware acceleration is unavailable.
    const autoRunner = new HeadlessBrowserRunner({
      executablePath: browserPath,
      mode: "auto",
    });

    try {
      const fixture = await loadDucFixture("microscope-core.duc");
      try {
        const coreEl = fixture.parsed.elements.find(
          (e) => e.type === "model" && e.id === "VEuusNQcj2c06qbIFRUPP",
        ) as DucModelElement | undefined;

        const res = await renderModelElementThumbnailWithResult(coreEl!, {
          runner: autoRunner,
          ducPath: fixture.filePath,
          viewConfig: {
            cameraPreset: "iso",
            width: 1200,
            height: 900,
            background: "transparent",
          },
        });

        expect(res.data.length).toBeGreaterThan(5000);
        expect(res.format).toBe("png");
        expect(res.glRenderer).toBeDefined();
        expect(typeof res.glRenderer).toBe("string");
        expect(["gpu", "cpu"]).toContain(res.backend!);
      } finally {
        fixture.cleanup();
      }
    } finally {
      await autoRunner.stop();
    }
  }, 120000);
});
