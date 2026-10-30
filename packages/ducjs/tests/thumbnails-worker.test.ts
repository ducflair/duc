import { describe, expect, it } from "bun:test";
import { PassThrough } from "stream";
import { runThumbnailWorkerServer } from "../src/thumbnails/worker";
import type { ThumbnailWorkerResponse } from "../src/thumbnails/types";

describe("thumbnails worker IPC server", () => {
  it("responds to ping requests via JSON lines", async () => {
    const inStream = new PassThrough();
    const outStream = new PassThrough();

    // Start worker in background
    const workerPromise = runThumbnailWorkerServer({
      stdin: inStream,
      stdout: outStream,
      // Provide dummy runner to avoid spawning browser during ping test
      runner: {
        start: async () => {},
        stop: async () => {},
        captureHtml: async () => ({ data: new Uint8Array(), base64: "" }),
      } as any,
    });

    const responses: ThumbnailWorkerResponse[] = [];
    outStream.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().trim().split("\n");
      for (const line of lines) {
        if (line) {
          responses.push(JSON.parse(line));
        }
      }
    });

    inStream.write(`${JSON.stringify({ id: "req-1", action: "ping" })}\n`);
    await new Promise((r) => setTimeout(r, 50));

    expect(responses.length).toBeGreaterThanOrEqual(1);
    expect(responses[0]).toEqual({ id: "req-1", ok: true });

    inStream.end();
  });

  it("handles malformed JSON with an error response", async () => {
    const inStream = new PassThrough();
    const outStream = new PassThrough();

    runThumbnailWorkerServer({
      stdin: inStream,
      stdout: outStream,
      runner: {
        start: async () => {},
        stop: async () => {},
        captureHtml: async () => ({ data: new Uint8Array(), base64: "" }),
      } as any,
    });

    const responses: ThumbnailWorkerResponse[] = [];
    outStream.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().trim().split("\n");
      for (const line of lines) {
        if (line) {
          responses.push(JSON.parse(line));
        }
      }
    });

    inStream.write("not valid json\n");
    await new Promise((r) => setTimeout(r, 50));

    expect(responses.length).toBeGreaterThanOrEqual(1);
    expect(responses[0].ok).toBe(false);
    expect(responses[0].error).toContain("Invalid JSON");

    inStream.end();
  });
});
