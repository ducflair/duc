# duc-renderer

A high-performance renderer for the DUC format, built with Rust and compiled to WebAssembly for universal compatibility.

### Status

This project is currently in development and not yet available as open source. We plan to open source `duc-renderer` in the near future as part of our broader commitment to making the entire `duc` ecosystem open and accessible.

### Architecture

The renderer is built using modern web technologies:

- **Language**: Rust for performance and memory safety
- **Target**: WebAssembly (WASM) for cross-platform compatibility
- **Rendering Engine**: [Vello](https://github.com/linebender/vello), a GPU-accelerated 2D renderer built on `wgpu`

This architecture enables the renderer to run efficiently in virtually any environment, including web browsers, desktop applications, and server environments.