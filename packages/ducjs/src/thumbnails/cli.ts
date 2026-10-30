#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { runThumbnailWorkerServer } from "./worker";
import { renderModelViewThumbnail } from "./render";
import type { CameraPreset, ModelThumbnailInput } from "./types";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--worker")) {
    await runThumbnailWorkerServer();
    return;
  }

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`
ducjs model thumbnail generator

Usage:
  duc-thumbnail --worker                         Run persistent JSON lines worker on stdin/stdout
  duc-thumbnail --input <file> --output <file>    Render model thumbnail from JSON input
  duc-thumbnail --preset <name>                  View preset (iso, top, front, etc.)
  duc-thumbnail --width <px> --height <px>       Dimensions (default: 1024x768)

Options:
  --input, -i       Path to JSON input with ModelThumbnailInput or DucModelElement
  --output, -o      Output image file path (default: thumbnail.png)
  --preset, -p      Camera preset (iso, top, bottom, front, rear, left, right)
  --width, -w       Output width in pixels
  --height, -h      Output height in pixels
  --worker          Persistent stdin/stdout worker mode for IPC with Rust/subprocesses
`);
    return;
  }

  let inputFile: string | null = null;
  let outputFile = "thumbnail.png";
  let preset: CameraPreset = "iso";
  let width = 1024;
  let height = 768;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === "--input" || arg === "-i") && i + 1 < args.length) {
      inputFile = args[++i];
    } else if ((arg === "--output" || arg === "-o") && i + 1 < args.length) {
      outputFile = args[++i];
    } else if ((arg === "--preset" || arg === "-p") && i + 1 < args.length) {
      preset = args[++i] as CameraPreset;
    } else if ((arg === "--width" || arg === "-w") && i + 1 < args.length) {
      width = parseInt(args[++i], 10);
    } else if ((arg === "--height" || arg === "-h") && i + 1 < args.length) {
      height = parseInt(args[++i], 10);
    }
  }

  let input: ModelThumbnailInput = {
    viewConfig: {
      cameraPreset: preset,
      width,
      height,
    },
  };

  if (inputFile) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), inputFile), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.type === "model") {
      input = {
        modelType: parsed.modelType,
        viewerState: parsed.viewerState,
        viewConfig: {
          cameraPreset: preset,
          width,
          height,
        },
      };
    } else {
      input = {
        ...parsed,
        viewConfig: {
          cameraPreset: preset,
          width,
          height,
          ...(parsed.viewConfig ?? {}),
        },
      };
    }
  }

  console.log(`Rendering model view thumbnail (${width}x${height}, preset: ${preset})...`);
  const result = await renderModelViewThumbnail(input);
  fs.writeFileSync(path.resolve(process.cwd(), outputFile), result.data);
  console.log(`Thumbnail written to ${outputFile} (${result.data.length} bytes, ${result.renderTimeMs}ms).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error generating thumbnail:", err);
  process.exit(1);
});
