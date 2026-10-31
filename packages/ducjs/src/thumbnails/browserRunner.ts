import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export type BrowserRendererMode = "auto" | "gpu" | "cpu";

export interface BrowserRunnerOptions {
  executablePath?: string;
  userDataDir?: string;
  useSoftwareRenderer?: boolean;
  mode?: BrowserRendererMode;
  timeoutMs?: number;
}

export interface CaptureHtmlResult {
  data: Uint8Array;
  base64: string;
  width: number;
  height: number;
  renderer?: string;
  isGpu?: boolean;
}

const COMMON_EXECUTABLE_PATHS: string[] = [
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
  // Windows
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

/**
 * Resolves the path to a Chrome or Chromium executable on the system.
 */
export function resolveBrowserExecutable(customPath?: string): string | null {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  const envPath =
    process.env.CHROME_PATH ||
    process.env.CHROMIUM_PATH ||
    process.env.GOOGLE_CHROME_BIN;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  for (const candidate of COMMON_EXECUTABLE_PATHS) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

interface CdpMessage {
  id: number;
  method: string;
  params?: Record<string, unknown>;
  sessionId?: string;
}

interface CdpResponse {
  id?: number;
  result?: Record<string, unknown>;
  error?: { message: string; code: number };
  method?: string;
  params?: Record<string, unknown>;
  sessionId?: string;
}

/**
 * Headless Chromium runner managing persistent browser lifecycle and CDP commands.
 */
export class HeadlessBrowserRunner {
  private executablePath: string;
  private userDataDir?: string;
  private browserProcess: ChildProcess | null = null;
  private ws: WebSocket | null = null;
  private wsUrl: string | null = null;
  private nextMessageId = 1;
  private pendingCallbacks = new Map<number, (res: CdpResponse) => void>();
  private mode: BrowserRendererMode;
  private useSoftwareRenderer: boolean;
  private isShuttingDown = false;
  private isAutoUserDataDir = false;
  private sessionExceptions = new Map<string, string>();

  constructor(options: BrowserRunnerOptions = {}) {
    const resolved = resolveBrowserExecutable(options.executablePath);
    if (!resolved) {
      throw new Error(
        "Could not find a Chrome or Chromium executable. Set CHROME_PATH or install Chrome.",
      );
    }
    this.executablePath = resolved;
    this.userDataDir = options.userDataDir;
    if (!this.userDataDir) {
      try {
        this.userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "duc-chrome-profile-"));
        this.isAutoUserDataDir = true;
      } catch {
        // Fall back to undefined if tempdir fails
      }
    }
    if (options.mode === "cpu" || options.useSoftwareRenderer === true) {
      this.mode = "cpu";
      this.useSoftwareRenderer = true;
    } else if (options.mode === "gpu" || options.useSoftwareRenderer === false) {
      this.mode = "gpu";
      this.useSoftwareRenderer = false;
    } else {
      this.mode = "auto";
      this.useSoftwareRenderer = false;
    }
  }

  /**
   * Spawns the headless browser process and establishes the CDP WebSocket connection.
   */
  public async start(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const args = [
      "--headless=new",
      "--remote-debugging-port=0",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-notifications",
      "--disable-extensions",
      "--disable-component-update",
      "--deny-permission-prompts",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-client-side-phishing-detection",
      "--disable-default-apps",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-sync",
      "--disable-translate",
      "--metrics-recording-only",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--allow-file-access-from-files",
      "--disable-web-security",
      "about:blank",
    ];

    if (this.userDataDir) args.push(`--user-data-dir=${this.userDataDir}`);

    if (this.useSoftwareRenderer) {
      args.push(
        "--disable-gpu",
        "--use-gl=angle",
        "--use-angle=swiftshader",
      );
    } else {
      args.push(
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--enable-gpu-rasterization",
        "--use-gl=angle",
      );
    }

    this.browserProcess = spawn(this.executablePath, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    const browserPid = this.browserProcess.pid;

    const cleanup = () => {
      if (!this.isShuttingDown && this.browserProcess) {
        this.stop().catch(() => {});
      }
    };
    process.once("exit", cleanup);
    process.once("SIGINT", cleanup);
    process.once("SIGTERM", cleanup);

    // Wait for DevTools WebSocket URL from stderr
    const wsUrl = await new Promise<string>((resolve, reject) => {
      let stderrBuffer = "";
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Timed out waiting for Chrome DevTools websocket URL. Stderr: ${stderrBuffer.slice(0, 500)}`,
          ),
        );
      }, 10000);

      const onData = (data: Buffer) => {
        stderrBuffer += data.toString();
        const match = stderrBuffer.match(
          /DevTools listening on (ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[a-zA-Z0-9-]+)/,
        );
        if (match) {
          clearTimeout(timeout);
          this.browserProcess?.stderr?.removeListener("data", onData);
          resolve(match[1]);
        }
      };

      this.browserProcess?.stderr?.on("data", onData);
      this.browserProcess?.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      this.browserProcess?.once("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`Chrome exited prematurely with code ${code}. Stderr: ${stderrBuffer.slice(0, 500)}`));
      });
    });

    this.wsUrl = wsUrl;

    // Connect WebSocket
    await new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (evt) => reject(new Error(`WebSocket connection failed: ${evt}`));
      this.ws.onmessage = (evt) => {
        try {
          const res: CdpResponse = JSON.parse(evt.data.toString());
          if (res.id && this.pendingCallbacks.has(res.id)) {
            const cb = this.pendingCallbacks.get(res.id)!;
            this.pendingCallbacks.delete(res.id);
            cb(res);
          }
          if (res.method === "Runtime.exceptionThrown" && res.params) {
            const details = (res.params as any).exceptionDetails;
            const desc = details?.exception?.description || details?.text || "Unknown page exception";
            this.sessionExceptions.set(res.sessionId || "", desc);
          }
          if (res.method === "Runtime.consoleAPICalled" && res.params) {
            const args = ((res.params as any).args || []).map((a: any) => a.value ?? a.description ?? "").join(" ");
            process.stderr.write(`[BrowserConsole] ${args}\n`);
          }
        } catch {
          // Ignore unparseable frames
        }
      };
    });
  }

  private sendCdp(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("CDP WebSocket is not connected.");
    }

    const id = this.nextMessageId++;
    const message: CdpMessage = { id, method, params };
    if (sessionId) {
      message.sessionId = sessionId;
    }

    return new Promise((resolve, reject) => {
      this.pendingCallbacks.set(id, (res) => {
        if (res.error) {
          reject(new Error(`CDP error (${res.error.code}): ${res.error.message}`));
        } else {
          resolve(res.result ?? {});
        }
      });
      this.ws!.send(JSON.stringify(message));
    });
  }

  /**
   * Captures a screenshot from an HTML document string, gracefully falling back from GPU to CPU in auto mode.
   */
  public async captureHtml(
    html: string,
    width: number,
    height: number,
    format: "png" | "jpeg" | "webp" = "png",
    timeoutMs = 45000,
  ): Promise<CaptureHtmlResult> {
    try {
      return await this.executeCaptureHtml(html, width, height, format, timeoutMs);
    } catch (err: any) {
      if (this.mode === "auto" && !this.useSoftwareRenderer) {
        process.stderr.write(
          `[BrowserRunner] GPU rendering failed (${err.message}). Falling back to CPU SwiftShader software renderer.\n`,
        );
        await this.stop();
        this.useSoftwareRenderer = true;
        return await this.executeCaptureHtml(html, width, height, format, timeoutMs);
      }
      throw err;
    }
  }

  private async executeCaptureHtml(
    html: string,
    width: number,
    height: number,
    format: "png" | "jpeg" | "webp" = "png",
    timeoutMs = 45000,
  ): Promise<CaptureHtmlResult> {
    await this.start();

    // Write HTML to temporary file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "duc-thumb-"));
    const htmlFile = path.join(tempDir, "index.html");
    fs.writeFileSync(htmlFile, html, "utf8");

    try {
      // Create new page target
      const { targetId } = (await this.sendCdp("Target.createTarget", {
        url: `file://${htmlFile}`,
      })) as { targetId: string };

      const { sessionId } = (await this.sendCdp("Target.attachToTarget", {
        targetId,
        flatten: true,
      })) as { sessionId: string };

      try {
        await this.sendCdp("Page.enable", {}, sessionId);
        await this.sendCdp("Runtime.enable", {}, sessionId);

        await this.sendCdp(
          "Emulation.setDeviceMetricsOverride",
          {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false,
          },
          sessionId,
        );

        // Wait for rendering to complete
        const start = Date.now();
        let ready = false;
        let actualWidth = width;
        let actualHeight = height;
        let glRenderer: string | undefined;
        let isGpu: boolean | undefined;

        while (Date.now() - start < timeoutMs) {
          const evalRes = (await this.sendCdp(
            "Runtime.evaluate",
            {
              expression: `(() => {
                if (window.__thumbnailError) return { status: "error", error: window.__thumbnailError };
                if (window.__thumbnailReady === true) {
                  return {
                    status: "ready",
                    width: window.__thumbnailWidth || ${width},
                    height: window.__thumbnailHeight || ${height},
                    base64: window.__thumbnailBase64 || null,
                    renderer: window.__thumbnailRenderer || null,
                    isGpu: window.__thumbnailIsGpu ?? null
                  };
                }
                return { status: "waiting" };
              })()`,
              returnByValue: true,
            },
            sessionId,
          )) as { result?: { value?: { status: string; error?: string; width?: number; height?: number; base64?: string | null; renderer?: string | null; isGpu?: boolean | null } } };

          const resVal = evalRes?.result?.value;
          if (resVal?.status === "ready") {
            ready = true;
            if (resVal.width && resVal.height) {
              actualWidth = resVal.width;
              actualHeight = resVal.height;
            }
            if (resVal.renderer) glRenderer = resVal.renderer;
            if (resVal.isGpu !== null && resVal.isGpu !== undefined) isGpu = resVal.isGpu;

            if (resVal.base64) {
              const binary = Uint8Array.from(Buffer.from(resVal.base64, "base64"));
              return {
                data: binary,
                base64: resVal.base64,
                width: actualWidth,
                height: actualHeight,
                renderer: glRenderer,
                isGpu: isGpu ?? !this.useSoftwareRenderer,
              };
            }
            break;
          }
          if (resVal?.status === "error") {
            throw new Error(`Renderer error in browser page: ${resVal.error}`);
          }
          const sessionErr = this.sessionExceptions.get(sessionId);
          if (sessionErr) {
            throw new Error(`Renderer script error in browser page: ${sessionErr}`);
          }

          await new Promise((r) => setTimeout(r, 100));
        }

        if (!ready) {
          throw new Error(`Timed out after ${timeoutMs}ms waiting for thumbnail render completion.`);
        }

        if (actualWidth !== width || actualHeight !== height) {
          await this.sendCdp(
            "Emulation.setDeviceMetricsOverride",
            {
              width: actualWidth,
              height: actualHeight,
              deviceScaleFactor: 1,
              mobile: false,
            },
            sessionId,
          ).catch(() => {});
        }

        // Capture screenshot
        const screenshotRes = (await this.sendCdp(
          "Page.captureScreenshot",
          {
            format,
            clip: {
              x: 0,
              y: 0,
              width: actualWidth,
              height: actualHeight,
              scale: 1,
            },
          },
          sessionId,
        )) as { data: string };

        const base64 = screenshotRes.data;
        const binary = Uint8Array.from(Buffer.from(base64, "base64"));

        return {
          data: binary,
          base64,
          width: actualWidth,
          height: actualHeight,
          renderer: glRenderer,
          isGpu: isGpu ?? !this.useSoftwareRenderer,
        };
      } finally {
        this.sessionExceptions.delete(sessionId);
        await this.sendCdp("Target.closeTarget", { targetId }).catch(() => {});
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Best-effort temp dir cleanup
      }
    }
  }

  /**
   * Terminates the browser process and closes WebSocket connections.
   */
  public async stop(): Promise<void> {
    this.isShuttingDown = true;
    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      if (this.browserProcess && !this.browserProcess.killed) {
        this.browserProcess.kill("SIGKILL");
        this.browserProcess = null;
      }
      if (this.isAutoUserDataDir && this.userDataDir) {
        try {
          fs.rmSync(this.userDataDir, { recursive: true, force: true });
        } catch {}
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

let sharedGpuRunner: HeadlessBrowserRunner | null = null;
let sharedCpuRunner: HeadlessBrowserRunner | null = null;
let sharedAutoRunner: HeadlessBrowserRunner | null = null;

/**
 * Gets or creates a singleton persistent headless browser runner based on acceleration preference.
 */
export function getSharedBrowserRunner(options?: BrowserRunnerOptions): HeadlessBrowserRunner {
  const mode =
    options?.mode ??
    (options?.useSoftwareRenderer === true
      ? "cpu"
      : options?.useSoftwareRenderer === false
        ? "gpu"
        : "auto");

  if (mode === "cpu") {
    if (!sharedCpuRunner) {
      sharedCpuRunner = new HeadlessBrowserRunner({ ...options, mode: "cpu", useSoftwareRenderer: true });
    }
    return sharedCpuRunner;
  }
  if (mode === "gpu") {
    if (!sharedGpuRunner) {
      sharedGpuRunner = new HeadlessBrowserRunner({ ...options, mode: "gpu", useSoftwareRenderer: false });
    }
    return sharedGpuRunner;
  }
  if (!sharedAutoRunner) {
    sharedAutoRunner = new HeadlessBrowserRunner({ ...options, mode: "auto" });
  }
  return sharedAutoRunner;
}

/**
 * Shuts down all cached shared browser runners.
 */
export async function shutdownAllBrowserRunners(): Promise<void> {
  const runners = [sharedGpuRunner, sharedCpuRunner, sharedAutoRunner].filter(Boolean) as HeadlessBrowserRunner[];
  sharedGpuRunner = null;
  sharedCpuRunner = null;
  sharedAutoRunner = null;
  await Promise.all(runners.map((r) => r.stop()));
}
