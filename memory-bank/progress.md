# Progress

## What Works
- Core Flatbuffers schema (schema/duc.fbs) is defined and maintained.
- TypeScript (ducjs), Python (ducpy), and Rust (ducrs) bindings are available.
- Utilities for parsing, validating, and manipulating duc files exist in all major languages.
- Web-based documentation and playground are accessible.

## What's Left to Build
- Expand documentation and usage examples for all language bindings.
- Enhance integration guides for external platforms (e.g., Scopture).
- Improve automated tooling for schema-to-binding generation.
- Add more format converters (e.g., PDF, SVG, DXF) and sample applications.

## Current Status
The project is stable and usable for core 2D CAD workflows, with active development on documentation, tooling, and integrations.

## Known Issues
- Keeping all language bindings in sync with schema changes requires manual steps.
- Some advanced CAD features and converters are still under development.
- Contribution process for some packages is limited or closed.

## Evolution of Project Decisions
- Adopted Flatbuffers for schema-driven, cross-language serialization.
- Moved to a monorepo structure for easier maintenance.
- Prioritized open-source licensing and community documentation.
