# Technical Context

## Technologies Used
- Flatbuffers (core schema and serialization)
- TypeScript/JavaScript (ducjs)
- Python (ducpy)
- Rust (ducrs)
- Node.js, Bun (JS runtime and tooling)
- React, Next.js (web documentation and playground)
- PDF, SVG, DXF libraries for format conversion

## Development Setup
- Monorepo structure with multiple packages for each language and utility.
- Node.js or Bun required for JavaScript/TypeScript development.
- Python 3.x and Rust toolchains for respective bindings.
- Flatbuffers compiler required to generate language bindings from schema/duc.fbs.
- Standard package managers: npm, bun, pip, cargo.

## Technical Constraints
- All data structures must be compatible with Flatbuffers serialization.
- Backward compatibility must be maintained when evolving the schema.
- Language bindings must stay in sync with the core schema.

## Dependencies
- @ducflair/duc (TypeScript package)
- flatbuffers (all languages)
- Python: flatbuffers, setuptools
- Rust: flatbuffers, serde
- Additional dependencies for PDF, SVG, DXF support in respective packages

## Tool Usage Patterns
- Flatbuffers compiler is used to generate/update bindings after schema changes.
- Each language package provides parsing, validation, and manipulation utilities.
- Web app and documentation use the TypeScript bindings for demos and guides.
