import { deflateSync } from "node:zlib";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = new Uint32Array(256);

for (let n = 0; n < crcTable.length; n++) {
  let value = n;
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[n] = value >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const checksumInput = Buffer.concat([typeBytes, data]);
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(checksumInput), data.length + 8);
  return chunk;
}

function createCadTestImage(longEdge: number): Uint8Array {
  const width = longEdge;
  const height = Math.max(1, Math.round(longEdge * 0.75));
  const stride = width + 1;
  const pixels = Buffer.alloc(stride * height, 255);
  const rectLeft = Math.round(width * 0.18);
  const rectRight = Math.round(width * 0.82);
  const rectTop = Math.round(height * 0.2);
  const rectBottom = Math.round(height * 0.8);

  for (let y = 0; y < height; y++) {
    const row = y * stride;
    pixels[row] = 0;
    for (let x = 0; x < width; x++) {
      const isMajorGrid = x % 512 < 2 || y % 512 < 2;
      const isMinorGrid = x % 64 === 0 || y % 64 === 0;
      const isOutline =
        ((x === rectLeft || x === rectRight) && y >= rectTop && y <= rectBottom) ||
        ((y === rectTop || y === rectBottom) && x >= rectLeft && x <= rectRight);
      const isDiagonal = Math.abs(y - (height * 0.5 + (x - width * 0.5) * 0.25)) < 2;
      if (isOutline || isDiagonal) pixels[row + x + 1] = 24;
      else if (isMajorGrid) pixels[row + x + 1] = 150;
      else if (isMinorGrid) pixels[row + x + 1] = 220;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 0;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    pngSignature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(pixels, { level: 1 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Supplies the host callbacks required by DXF rendering without coupling DucJS tests to DucPDF.
 */
export function createDxfThumbnailTestHost() {
  const images = new Map<number, Uint8Array>();

  return {
    convertDxfToPdf: async (dxf: Uint8Array): Promise<Uint8Array> => {
      if (dxf.byteLength === 0) throw new Error("Test DXF input must not be empty.");
      return Buffer.from(`%PDF-1.7\n% DWGPDF host test adapter\n% ${dxf.byteLength}\n%%EOF\n`);
    },
    rasterizePdf: async (pdf: Uint8Array, maxDimension: number): Promise<Uint8Array> => {
      if (Buffer.from(pdf).toString("ascii", 0, 5) !== "%PDF-") {
        throw new Error("Test host expected PDF bytes from the DXF converter.");
      }
      const longEdge = Math.max(1, Math.round(maxDimension));
      let image = images.get(longEdge);
      if (!image) {
        image = createCadTestImage(longEdge);
        images.set(longEdge, image);
      }
      return image;
    },
  };
}
