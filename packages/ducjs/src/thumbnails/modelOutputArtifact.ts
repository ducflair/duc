import crypto from 'node:crypto';
import type { DucExternalFiles, ExternalFilesData, DucModelElement, ExternalFileId } from '../types';
import type { RenderThumbnailOptions } from './render';
import type { ModelThumbnailResult } from './types';
import { getSharedBrowserRunner } from './browserRunner';
import { getModelThumbnailBoundsUpdate } from './bounds';

export interface ModelOutputArtifact {
  envelope: { version: 1; kind: string; renderer: string; mimeType: string; contentHash: string; sourceFingerprint: string; inputFingerprints: Record<string, string> };
  data: Uint8Array;
  preview?: Uint8Array;
}

const hash = (data: string | Uint8Array) => crypto.createHash('sha256').update(data).digest('hex');
const revisionBytes = (fileId: string, files?: DucExternalFiles, data?: ExternalFilesData) => {
  const revisionId = files?.[fileId as ExternalFileId]?.activeRevisionId;
  return revisionId ? data?.[revisionId] : undefined;
};

export const readPersistedModelArtifact = (element: DucModelElement, files?: DucExternalFiles, data?: ExternalFilesData): ModelOutputArtifact | null => {
  const output = (element.customData as any)?.modelOutput;
  if (output?.version !== 1 || output.status !== 'fresh' || typeof output.fileId !== 'string') return null;
  if (output.sourceFingerprint !== hash(JSON.stringify({ code: element.code || '', modules: [] }))) return null;
  const inputs = (element.fileIds || []).filter(id => !id.startsWith('model_output_') && !id.startsWith('model_preview_') && !id.startsWith('dwg_dxf_cache_') && !(element.modelType?.toLowerCase() === 'python' && id.startsWith('model_python_')));
  const fingerprints = Object.keys(output.inputFingerprints || {});
  if (inputs.length !== fingerprints.length || inputs.some(id => !fingerprints.includes(id))) return null;
  for (const [id, expected] of Object.entries(output.inputFingerprints || {})) {
    const bytes = revisionBytes(id, files, data);
    const file = files?.[id as ExternalFileId];
    const checksum = file?.revisions[file.activeRevisionId]?.checksum;
    if (bytes ? hash(bytes) !== expected : checksum !== expected) return null;
  }
  const bytes = revisionBytes(output.fileId, files, data);
  if (!bytes?.byteLength || hash(bytes) !== output.contentHash) return null;
  return { envelope: output, data: bytes, preview: output.previewFileId ? revisionBytes(output.previewFileId, files, data) : undefined };
};

export const parseModelArtifactPayload = (payload: string): ModelOutputArtifact => {
  const value = JSON.parse(payload);
  const data = value.dataBase64 ? new Uint8Array(Buffer.from(value.dataBase64, 'base64')) : new TextEncoder().encode(value.content || '');
  if (value.type !== 'artifact' || value.envelope?.version !== 1 || hash(data) !== value.envelope.contentHash) throw new Error('Invalid model output artifact');
  return { envelope: value.envelope, data };
};

export const renderModelArtifact = async (artifact: ModelOutputArtifact, element: DucModelElement, options: RenderThumbnailOptions): Promise<ModelThumbnailResult> => {
  let bytes = artifact.data;
  let mime = artifact.envelope.mimeType;
  const renderer = artifact.envelope.renderer;
  if (renderer === 'pdf') {
    if (options.rasterizePdf) bytes = await options.rasterizePdf(bytes, 1200);
    else if (element.thumbnail?.byteLength && (element.customData as any)?.scoptureModelContentGeneration === (element.customData as any)?.modelOutput?.generation) bytes = element.thumbnail;
    else throw new Error('PDF model output requires a host PDF rasterizer');
    mime = 'image/png';
  }
  if (!['image', 'svg', 'pdf', 'table'].includes(renderer)) throw new Error(`Unsupported artifact thumbnail renderer: ${renderer}`);
  if (renderer !== 'table' && !/^image\/(png|jpeg|webp|svg\+xml)$/.test(mime)) throw new Error('Unsupported image output MIME type');
  const width = Math.min(8192, Math.max(1, Math.round(options.viewConfig?.width || 1200)));
  const height = Math.min(8192, Math.max(1, Math.round(options.viewConfig?.height || 900)));
  const payload = Buffer.from(bytes).toString('base64');
  const script = renderer === 'table' ? `
    const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('${payload}'), c => c.charCodeAt(0))));
    const columns = Array.isArray(value) ? [...new Set(value.flatMap(row => Object.keys(row)))] : value.columns;
    const rows = Array.isArray(value) ? value.map(row => columns.map(column => row[column])) : value.rows;
    const table = document.createElement('table');
    for (const row of [columns, ...rows.slice(0, 25)]) { const tr = table.insertRow(); for (const cell of row) tr.insertCell().textContent = String(cell ?? ''); }
    document.body.appendChild(table);
    window.__thumbnailReady = true;` : `
    const image = new Image(); image.src = 'data:${mime};base64,${payload}';
    document.body.appendChild(image); image.decode().then(() => { window.__thumbnailReady = true; }).catch(error => { window.__thumbnailError = String(error); });`;
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:white;width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;font:20px sans-serif}img{max-width:100%;max-height:100%;object-fit:contain}table{border-collapse:collapse}td{border:1px solid #ccc;padding:8px}</style><body><script>${script}</script></body>`;
  const runner = options.runner || getSharedBrowserRunner({ executablePath: options.browserExecutablePath, mode: options.mode, useSoftwareRenderer: options.useSoftwareRenderer });
  const format = options.format || 'png';
  const start = Date.now();
  const result = await runner.captureHtml(html, width, height, format, options.timeoutMs || 45000);
  return { data: result.data, base64: result.base64, width: result.width, height: result.height, format, renderTimeMs: Date.now() - start, boundsUpdate: getModelThumbnailBoundsUpdate(element, result.width, result.height), glRenderer: result.renderer, backend: result.isGpu ? 'gpu' : 'cpu' };
};
