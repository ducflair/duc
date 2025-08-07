/**
 * Synchronously converts data to a Base64 Data URL.
 *
 * This function is truly synchronous and works in both Node.js and browser environments.
 *
 * @param data The input data. Can be a UTF-8 string, a Uint8Array, or an ArrayBuffer.
 * @param mimeType The MIME type for the Data URL.
 * @returns A fully formed Base64 Data URL string.
 */
export function toDataURL(
  data: string | Uint8Array | ArrayBuffer,
  mimeType: string = 'application/octet-stream' // A more generic default
): string {
  try {
    // If data is already a valid data URL, return it directly.
    if (typeof data === 'string' && data.startsWith('data:')) {
      return data;
    }

    let base64String: string;

    if (typeof data === 'string') {
      // Handle UTF-8 strings by converting them to a byte array first,
      // then encoding. This is more robust than the btoa(unescape(encodeURIComponent(...))) trick.
      const bytes = new TextEncoder().encode(data);
      base64String = uint8ArrayToBase64(bytes);
    } else {
      // For ArrayBuffer, we need to create a Uint8Array view.
      // If it's already a Uint8Array, we can use it directly.
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      base64String = uint8ArrayToBase64(bytes);
    }

    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error generating data URL:', error);
    throw error; // Re-throw the error after logging
  }
}

/**
 * Synchronously decodes a Base64 Data URL into its constituent parts.
 *
 * This function only supports Base64 encoded Data URLs.
 *
 * @param dataUrl The Base64 Data URL string (e.g., "data:image/png;base64,iVBOR...").
 * @returns An object containing the decoded Uint8Array and the MIME type.
 * @throws An error if the input is not a valid or supported Data URL.
 */
export function fromDataURL(dataUrl: string): { data: Uint8Array; mimeType: string } {
  // 1. Validation
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Invalid Data URL: Must start with "data:".');
  }

  // 2. Find the metadata/data separator (the first comma)
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid Data URL: No comma separator found.');
  }

  // 3. Extract header and base64 data
  const header = dataUrl.substring(5, commaIndex); // "data:".length is 5
  const base64Data = dataUrl.substring(commaIndex + 1);

  // 4. Parse header to get MIME type and check for base64 encoding
  const headerParts = header.split(';');
  const mimeType = headerParts[0] || 'application/octet-stream'; // Default MIME if empty

  if (headerParts[headerParts.length - 1] !== 'base64') {
    throw new Error('Unsupported Data URL: Only base64 encoding is supported.');
  }

  // 5. Decode the base64 data using our helper function
  const data = base64ToUint8Array(base64Data);

  return { data, mimeType };
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  
  // Browser environment
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  // Node.js environment
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  
  // Browser environment
  // Sanitize the base64 string by removing any characters that are not part of the standard base64 alphabet
  const sanitizedBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const binaryString = atob(sanitizedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}


/**
 * Converts a Uint8Array to a browser File object.
 *
 * @param bytes The Uint8Array containing the binary data of the file.
 * @param fileName The desired name for the file, including its extension (e.g., "thumbnail.png").
 * @param options Optional settings for the file.
 * @param options.mimeType The MIME type of the file (e.g., "image/png"). Defaults to "application/octet-stream".
 * @param options.lastModified The timestamp (milliseconds since epoch) for the file's last modified date. Defaults to the current time.
 * @returns A File object.
 */
export function uint8ArrayToFile(
  bytes: Uint8Array,
  fileName: string,
  options: {
    mimeType?: string;
    lastModified?: number;
  } = {}
): File {
  // Set default values for options
  const mimeType = options.mimeType ?? 'application/octet-stream';
  const lastModified = options.lastModified ?? Date.now();

  // Create and return the File object
  return new File([new Uint8Array(bytes)], fileName, {
    type: mimeType,
    lastModified: lastModified,
  });
}