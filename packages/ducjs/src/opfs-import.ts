import { Decompress } from "fflate";

const DEFAULT_COMPRESSED_CHUNK_SIZE = 64 * 1024;
const DEFAULT_WRITE_BUFFER_SIZE = 1024 * 1024;
const SQLITE_HEADER = new TextEncoder().encode("SQLite format 3\0");

export type OpfsChunkImporter = {
  writeChunk(data: Uint8Array): void;
};

export type DucStreamImportOptions = {
  compressedChunkSize?: number;
  writeBufferSize?: number;
};

class BufferedImporterWriter {
  private readonly buffer: Uint8Array;
  private offset = 0;
  private totalBytes = 0;

  constructor(
    private readonly importer: OpfsChunkImporter,
    bufferSize: number,
  ) {
    if (!Number.isSafeInteger(bufferSize) || bufferSize <= 0) {
      throw new RangeError("writeBufferSize must be a positive safe integer");
    }
    this.buffer = new Uint8Array(bufferSize);
  }

  write(chunk: Uint8Array): void {
    let sourceOffset = 0;
    while (sourceOffset < chunk.byteLength) {
      const writable = Math.min(
        this.buffer.byteLength - this.offset,
        chunk.byteLength - sourceOffset,
      );
      this.buffer.set(
        chunk.subarray(sourceOffset, sourceOffset + writable),
        this.offset,
      );
      this.offset += writable;
      sourceOffset += writable;

      if (this.offset === this.buffer.byteLength) {
        this.flush();
      }
    }
  }

  finish(): number {
    this.flush();
    return this.totalBytes;
  }

  private flush(): void {
    if (this.offset === 0) return;
    this.importer.writeChunk(this.buffer.subarray(0, this.offset));
    this.totalBytes += this.offset;
    this.offset = 0;
  }
}

/**
 * Incrementally copy raw SQLite or decompress a compressed DUC stream into an
 * OPFS importer. Neither input nor SQLite payload is materialized as one JS buffer.
 */
export async function importDucStreamToOpfs(
  stream: ReadableStream<Uint8Array>,
  importer: OpfsChunkImporter,
  options: DucStreamImportOptions = {},
): Promise<number> {
  const compressedChunkSize =
    options.compressedChunkSize ?? DEFAULT_COMPRESSED_CHUNK_SIZE;
  if (!Number.isSafeInteger(compressedChunkSize) || compressedChunkSize <= 0) {
    throw new RangeError("compressedChunkSize must be a positive safe integer");
  }

  const writer = new BufferedImporterWriter(
    importer,
    options.writeBufferSize ?? DEFAULT_WRITE_BUFFER_SIZE,
  );
  const decompressor = new Decompress((chunk) => writer.write(chunk));
  const reader = stream.getReader();
  const header = new Uint8Array(SQLITE_HEADER.byteLength);
  let headerLength = 0;
  let isRawSqlite: boolean | null = null;

  const writeCompressed = (chunk: Uint8Array): void => {
    for (let offset = 0; offset < chunk.byteLength; offset += compressedChunkSize) {
      decompressor.push(
        chunk.subarray(offset, Math.min(chunk.byteLength, offset + compressedChunkSize)),
        false,
      );
    }
  };

  const writeDetected = (chunk: Uint8Array): void => {
    if (isRawSqlite) {
      writer.write(chunk);
    } else {
      writeCompressed(chunk);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;

      let valueOffset = 0;
      if (isRawSqlite === null) {
        const headerBytes = Math.min(
          header.byteLength - headerLength,
          value.byteLength,
        );
        header.set(value.subarray(0, headerBytes), headerLength);
        headerLength += headerBytes;
        valueOffset = headerBytes;

        if (headerLength === header.byteLength) {
          isRawSqlite = header.every((byte, index) => byte === SQLITE_HEADER[index]);
          writeDetected(header);
        }
      }

      if (isRawSqlite !== null && valueOffset < value.byteLength) {
        writeDetected(value.subarray(valueOffset));
      }
    }

    if (isRawSqlite === null) {
      isRawSqlite = false;
      writeCompressed(header.subarray(0, headerLength));
    }
    if (!isRawSqlite) {
      decompressor.push(new Uint8Array(), true);
    }
    return writer.finish();
  } finally {
    reader.releaseLock();
  }
}
