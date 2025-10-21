# duc2pdf

<p align="center">
  <br/>
  <a href="https://duc.ducflair.com" target="_blank"><img width="256px" src="https://raw.githubusercontent.com/ducflair/assets/refs/heads/main/src/duc/duc-extended.png" /></a>
  <p align="center">Rust CLI Tool for duc to PDF Conversion</p>
  <p align="center" style="align: center;">
    <a href="https://crates.io/crates/duc2pdf/"><img src="https://shields.io/badge/Crates-FFC933?logo=Rust&logoColor=646464&style=round-square" alt="Crates" /></a>
    <a href="https://github.com/ducflair/duc/releases"><img src="https://img.shields.io/crates/v/duc2pdf?style=round-square&label=latest%20stable" alt="Crates.io duc2pdf@latest release" /></a>
    <a href="https://crates.io/crates/duc2pdf"><img src="https://img.shields.io/crates/d/duc2pdf?style=round-square&color=salmon" alt="Downloads" /></a>
    <img src="https://shields.io/badge/Rust-CE412B?logo=Rust&logoColor=fff&style=round-square" alt="Rust" />
  </p>
</p>

The `duc2pdf` crate provides a robust Rust implementation for converting `duc` 2D CAD files to PDF format. Designed for professionals seeking precision and efficiency, this crate ensures industry-grade PDF output that adheres to ISO 32000-2 standards.

## Introduction

The `duc2pdf` crate offers comprehensive Rust types and helper functions to convert `duc` CAD files to high-quality PDF documents. Built with efficiency and performance in mind, this crate enables you to process complex CAD data and generate professional PDF output for sharing, printing, and archiving.

For a 2D CAD industry grade PDF export, we need to adhere to the ISO 32000-2 which PDFs support, ensuring precise vector graphics, proper scaling, and accurate color representation.

## Features

- **Rust Support:** Strongly-typed interfaces for all aspects of the `duc` to PDF conversion process, ensuring type safety and performance.
- **Industry Standards Compliance:** Full compliance with ISO 32000-2 PDF standards for professional CAD output.
- **High Performance:** Optimized processing to handle complex CAD data and generate PDFs efficiently.
- **CLI Tool:** Command-line interface for easy integration into build pipelines and workflows.
- **Precision Output:** Maintains exact vector precision, dimensions, and styling from the original duc files.

## Installation

Install the crate using Cargo:

```bash
cargo add duc2pdf
```

Or install the CLI tool:

```bash
cargo install duc2pdf
```

## Usage

### As a library:

```rust
use duc2pdf::*;

// Convert duc file to PDF
let result = duc2pdf::convert("input.duc", "output.pdf").unwrap();
```

### As a CLI tool:

```bash
duc2pdf input.duc output.pdf
```

## Documentation

For detailed documentation, including all available types and utility functions, visit our [Documentation](https://duc.ducflair.com).

## Tools

- [Playground](https://ducflair.com/core): Experiment with the `duc` format in a live environment.
- [Documentation](https://duc.ducflair.com): Comprehensive guides and API references.


## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.

## Commit Message Guidelines

To ensure smooth releases with semantic-release, please follow [these guidelines](https://semantic-release.gitbook.io/semantic-release#how-does-it-work).

---

*The duc format and libraries are constantly evolving, aiming to set new standards in the 2D CAD industry. Be a part of this transformation and help shape the future of design technology!*

