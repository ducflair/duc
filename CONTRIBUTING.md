# Contributing to `duc`

Thanks for your interest in contributing! We welcome all forms of contributions, from code to documentation, design, or community support.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) `>=1.1.24` (package manager)
- [Node.js](https://nodejs.org/) `>=20`
- [Git LFS](https://git-lfs.com/) — **required** to clone this repository

### Git LFS

This repository tracks CAD, 3D, and engineering binary files (`.duc`, `.dxf`, `.dwg`, `.stl`, `.obj`, `.fbx`, etc.) through [Git LFS](https://git-lfs.com/). You must install and initialize it before cloning, otherwise those files will be checked out as pointer stubs instead of the actual content.

Install:

```sh
# macOS
brew install git-lfs

# Debian/Ubuntu
sudo apt install git-lfs

# Windows
winget install GitHub.GitLFS
```

Initialize once per machine:

```sh
git lfs install
```

If you already cloned the repo before installing LFS, run:

```sh
git lfs pull
```

The full list of tracked extensions lives in [`.gitattributes`](./.gitattributes).

### Setup

```sh
git clone https://github.com/ducflair/duc.git
cd duc
bun install
```

## Commit Message Guidelines

To assure semantic release works, follow [these guidelines](https://semantic-release.gitbook.io/semantic-release#how-does-it-work).

Notes:

- Package names are inferred from the configured semantic-release `paths` (for example, `packages/ducpy` -> `ducpy`).
- Use lowercase package names to keep it consistent.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
