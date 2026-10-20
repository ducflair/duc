import readline from "readline";
import {
  renderModelViewThumbnail,
  type RenderThumbnailOptions,
} from "./render";
import {
  getSharedBrowserRunner,
  HeadlessBrowserRunner,
} from "./browserRunner";
import type {
  ThumbnailWorkerRequest,
  ThumbnailWorkerResponse,
} from "./types";

export interface WorkerServerOptions extends RenderThumbnailOptions {
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

/**
 * Runs a persistent thumbnail rendering server over stdin/stdout using JSON lines.
 * Designed for seamless integration with Rust subprocesses (e.g. ducpdf, ducrs).
 */
export async function runThumbnailWorkerServer(
  options: WorkerServerOptions = {},
): Promise<void> {
  const inputStream = options.stdin ?? process.stdin;
  const outputStream = options.stdout ?? process.stdout;

  const runner =
    options.runner ??
    getSharedBrowserRunner({
      executablePath: options.browserExecutablePath,
      useSoftwareRenderer: options.useSoftwareRenderer ?? true,
    });

  // Pre-warm the headless browser
  try {
    await runner.start();
  } catch (err) {
    // Stderr logging for diagnostics without corrupting stdout JSON protocol
    console.error("[ThumbnailWorker] Warning during pre-warm:", err);
  }

  const rl = readline.createInterface({
    input: inputStream,
    terminal: false,
  });

  const sendResponse = (response: ThumbnailWorkerResponse) => {
    outputStream.write(`${JSON.stringify(response)}\n`);
  };

  rl.on("line", async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req: ThumbnailWorkerRequest;
    try {
      req = JSON.parse(trimmed) as ThumbnailWorkerRequest;
    } catch (err) {
      sendResponse({
        id: "unknown",
        ok: false,
        error: `Invalid JSON request: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    if (req.action === "ping") {
      sendResponse({ id: req.id, ok: true });
      return;
    }

    if (req.action === "shutdown") {
      try {
        await runner.stop();
      } catch {
        // Best-effort
      }
      sendResponse({ id: req.id, ok: true });
      process.exit(0);
      return;
    }

    if (req.action === "render") {
      try {
        let input = req.input;
        if (!input && req.element) {
          input = {
            modelType: req.element.modelType,
            viewerState: req.element.viewerState,
            viewConfig: req.viewConfig,
          };
        }

        if (!input) {
          sendResponse({
            id: req.id,
            ok: false,
            error: "Missing input or element in render request.",
          });
          return;
        }

        const renderRes = await renderModelViewThumbnail(input, {
          ...options,
          runner,
        });

        sendResponse({
          id: req.id,
          ok: true,
          result: {
            base64: renderRes.base64,
            format: renderRes.format,
            width: renderRes.width,
            height: renderRes.height,
            renderTimeMs: renderRes.renderTimeMs,
          },
        });
      } catch (err) {
        sendResponse({
          id: req.id,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    sendResponse({
      id: req.id,
      ok: false,
      error: `Unknown action: ${(req as { action?: string }).action}`,
    });
  });
}
