# System Patterns

## System Architecture
- Modular, multi-language ecosystem centered on the `duc` 2D CAD file format.
- Core schema defined in Flatbuffers (schema/duc.fbs) for performance and cross-platform compatibility.
- Language bindings and utilities for TypeScript (ducjs), Python (ducpy), Rust (ducrs), and additional packages for PDF, SVG, and DXF support.
- Web-based documentation and playground for user onboarding and experimentation.

## Key Technical Decisions
- Flatbuffers chosen for efficient, strongly-typed serialization and backward compatibility.
- MIT license to encourage open-source adoption and contributions.
- Maintain a single source of truth for the schema, with automated generation of language bindings.

## Design Patterns in Use
- Schema-driven development: all data structures and APIs are derived from the Flatbuffers schema.
- Strong typing and interface-driven design in all language bindings.
- Modular package structure for maintainability and extensibility.

## Component Relationships
- schema/duc.fbs is the foundation for all language bindings and utilities.
- ducjs, ducpy, ducrs, ducpdf, ducsvg, and ducdxf packages each provide language- or format-specific functionality, but share the same core schema.
- Web app and documentation integrate with the core libraries for demos and guides.

## Critical Implementation Paths
- Schema updates propagate to all language bindings via automated tooling.
- Parsing, validation, and manipulation of duc files are handled by each language binding, following the schema definitions.
- Integration with external platforms (e.g., Scopture) via open APIs and extensible architecture.
