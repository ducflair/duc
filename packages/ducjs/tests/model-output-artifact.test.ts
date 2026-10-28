import { expect, test } from "bun:test";
import crypto from "node:crypto";
import type { DucModelElement, DucExternalFiles, ExternalFilesData } from "../src/types";
import { readPersistedModelArtifact, parseModelArtifactPayload } from "../src/thumbnails/modelOutputArtifact";

const hash = (data: string | Uint8Array) => crypto.createHash("sha256").update(data).digest("hex");
const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
const input = new TextEncoder().encode("input");
const envelope = {
  version: 1, kind: "svg", renderer: "svg", mimeType: "image/svg+xml", status: "fresh",
  fileId: "model_output_m", contentHash: hash(bytes), sourceFingerprint: hash(JSON.stringify({ code: "emit_output(svg, kind='svg')", modules: [] })),
  inputFingerprints: { source: hash(input) },
};
const element = { id: "m", fileIds: ["source", "model_output_m"], code: "emit_output(svg, kind='svg')", customData: { modelOutput: envelope } } as unknown as DucModelElement;
const files = { model_output_m: { activeRevisionId: "output1" }, source: { activeRevisionId: "source1", revisions: { source1: { checksum: hash(input) } } } } as unknown as DucExternalFiles;
const data = { output1: bytes, source1: input } as ExternalFilesData;

test("persisted output is available only for the matching code, inputs and artifact bytes", () => {
  expect(readPersistedModelArtifact(element, files, data)?.envelope.renderer).toBe("svg");
  expect(readPersistedModelArtifact({ ...element, code: "changed" }, files, data)).toBeNull();
  expect(readPersistedModelArtifact({ ...element, fileIds: [...element.fileIds, "new-input" as never] }, files, data)).toBeNull();
  expect(readPersistedModelArtifact({ ...element, fileIds: [] }, files, data)).toBeNull();
  expect(readPersistedModelArtifact(element, files, { ...data, source1: new Uint8Array([1]) })).toBeNull();
  expect(readPersistedModelArtifact(element, files, { ...data, output1: new Uint8Array([1]) })).toBeNull();
  expect(readPersistedModelArtifact(element, files, { output1: bytes } as ExternalFilesData)).not.toBeNull();
});

test("transport artifacts preserve their output envelope and reject damaged bytes", () => {
  const artifact = { type: "artifact", envelope, dataBase64: Buffer.from(bytes).toString("base64") };
  expect(parseModelArtifactPayload(JSON.stringify(artifact)).data).toEqual(bytes);
  expect(() => parseModelArtifactPayload(JSON.stringify({ ...artifact, dataBase64: "eA==" }))).toThrow("Invalid model output artifact");
});
