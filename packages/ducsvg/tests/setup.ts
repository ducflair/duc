import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Mock document and XMLSerializer for pdfjs-dist SVG backend
if (typeof globalThis.document === 'undefined') {
  class SVGElement {
    attributes: Map<string, string> = new Map();
    children: SVGElement[] = [];
    textContent: string = '';
    tagName: string;
    namespaceURI: string = 'http://www.w3.org/2000/svg';
    
    constructor(tagName: string) {
      this.tagName = tagName;
    }
    
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    }
    
    setAttributeNS(ns: string | null, name: string, value: string) {
      this.attributes.set(name, value);
    }
    
    getAttribute(name: string): string | null {
      return this.attributes.get(name) || null;
    }
    
    hasAttribute(name: string): boolean {
      return this.attributes.has(name);
    }
    
    appendChild(child: SVGElement) {
      this.children.push(child);
      return child;
    }
    
    append(...nodes: SVGElement[]) {
      for (const node of nodes) {
        this.children.push(node);
      }
    }
    
    cloneNode(deep: boolean = false): SVGElement {
      const clone = new SVGElement(this.tagName);
      // Copy attributes
      this.attributes.forEach((value, key) => {
        clone.attributes.set(key, value);
      });
      clone.textContent = this.textContent;
      // Deep clone children if requested
      if (deep) {
        clone.children = this.children.map(child => child.cloneNode(true));
      }
      return clone;
    }
    
    toString(): string {
      const attrs = Array.from(this.attributes.entries())
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      const opening = attrs ? `<${this.tagName} ${attrs}>` : `<${this.tagName}>`;
      const content = this.textContent || this.children.map(c => c.toString()).join('');
      return `${opening}${content}</${this.tagName}>`;
    }
  }
  
  globalThis.document = {
    // @ts-ignore - Mock DOM for pdfjs-dist
    createElementNS: (ns: string, tagName: string) => new SVGElement(tagName),
  };
  
  // @ts-ignore - Mock XMLSerializer for pdfjs-dist
  globalThis.XMLSerializer = class {
    serializeToString(node: SVGElement): string {
      return node.toString();
    }
  };
}

// Bun has native WASM support, but we need to ensure fetch works for file:// URLs
const originalFetch = globalThis.fetch;

// @ts-ignore - We're replacing fetch with a compatible implementation
globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  // Handle WASM file loading
  if (url.endsWith('.wasm')) {
    try {
      const parsedUrl = new URL(url);
      let filePath: string;
      
      if (parsedUrl.protocol === 'file:') {
        filePath = fileURLToPath(parsedUrl);
      } else {
        // Try as absolute path
        filePath = parsedUrl.pathname;
        // Handle Vite's /@fs/ prefix
        if (filePath.startsWith('/@fs')) {
          filePath = filePath.substring(4);
        }
      }
      
      // Read the WASM file and convert to Uint8Array for Response
      const buffer = readFileSync(filePath);
      const uint8Array = new Uint8Array(buffer);
      
      // Return a proper Response with the WASM data
      return new Response(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': 'application/wasm',
        },
      });
    } catch (error) {
      console.error('Failed to load WASM file:', url, error);
      throw error;
    }
  }
  
  // For other URLs, use original fetch
  return originalFetch(input as any, init);
};
