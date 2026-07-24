import { describe, expect, test } from "bun:test";
import { getRenderablePdfFileId } from "../src/types/elements/typeChecks";
import type { DucElement, ExternalFileId } from "../src/types";

const createDocElement = ({
  fileId,
  referencedFileIds = [],
}: {
  fileId: string;
  referencedFileIds?: string[];
}) => ({
  id: "doc-1",
  type: "doc",
  fileId: fileId as ExternalFileId,
  referencedFileIds: referencedFileIds as ExternalFileId[],
}) as DucElement;

describe("getRenderablePdfFileId", () => {
  test("uses the compiled PDF cache for a document element", () => {
    const element = createDocElement({
      fileId: "doc_typst_source_doc-1",
      referencedFileIds: ["doc_pdf_cache_doc-1"],
    });

    expect(getRenderablePdfFileId(element)).toBe("doc_pdf_cache_doc-1");
  });

  test("does not treat Typst source as a legacy PDF", () => {
    const element = createDocElement({ fileId: "doc_typst_source_doc-1" });

    expect(getRenderablePdfFileId(element)).toBeNull();
  });

  test("preserves the legacy document PDF fallback", () => {
    const element = createDocElement({ fileId: "legacy-document.pdf" });

    expect(getRenderablePdfFileId(element)).toBe("legacy-document.pdf");
  });
});
