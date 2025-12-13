<p align="center">
  <br/>
  <a href="https://duc.ducflair.com" target="_blank"><img width="256px" src="https://raw.githubusercontent.com/ducflair/assets/refs/heads/main/src/duc/duc-extended.png" /></a>
  <p align="center">SVG Adapter for the duc 2D CAD File Format</p>
  <p align="center" style="align: center;">
    <a href="https://www.npmjs.com/package/ducsvg"><img src="https://shields.io/badge/NPM-cc3534?logo=Npm&logoColor=white&style=round-square" alt="NPM" /></a>
    <a href="https://www.npmjs.com/package/ducsvg"><img src="https://img.shields.io/npm/v/ducsvg/latest?style=round-square&label=latest%20stable" alt="NPM ducsvg@latest release" /></a>
    <a href="https://www.npmtrends.com/ducsvg"><img src="https://img.shields.io/npm/dm/ducsvg?style=round-square&color=salmon" alt="Downloads" /></a>
  </p>
</p>

# ducsvg

`ducsvg` is a lightweight adapter for rendering `duc` CAD documents to SVG. It’s built on top of `ducjs` and focuses on accurate, standards-compliant SVG output you can embed in browsers or export from Node.js.

> This library leverages the stable renderer from `ducpdf`, first converting the `duc` document to PDF format before transforming it into SVG using `pdf-into-svg`. This approach ensures high fidelity in the SVG output by utilizing the robust rendering capabilities of the PDF format.

> 💡 Maybe in the future we could refactor `ducpdf` to leverage the growing library [`hayro_svg`](https://docs.rs/hayro-svg/latest/hayro_svg/) to convert PDF to SVG more seamlessly instead of using `pdf-into-svg` (C# library). Reference: [hayro project](https://github.com/LaurenzV/hayro?tab=readme-ov-file)

## Documentation

For detailed documentation, including all available types and utility functions, visit our [Documentation](https://duc.ducflair.com).

## Tools

- [Playground](https://ducflair.com/core): Experiment with the `duc` format in a live environment.
- [Documentation](https://duc.ducflair.com): Comprehensive guides and API references.

## Contributing

At the moment we are not accepting contributions to this package. However, we welcome feedback and suggestions for future improvements. Feel free to open an issue or contact us at [Ducflair Support](https://www.ducflair.com/support).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.


## Commit Message Guidelines

To ensure smooth releases with semantic-release, please follow [these guidelines](https://semantic-release.gitbook.io/semantic-release#how-does-it-work).

---

*The duc format and libraries are constantly evolving, aiming to set new standards in the 2D CAD industry. Be a part of this transformation and help shape the future of design technology!*


