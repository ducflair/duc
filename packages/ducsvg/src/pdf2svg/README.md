# PDF to SVG conversion

Notice that we are using `pdfjs-dist` version `2.16.105` which is not the latest version.
The reason for this is that later versions of `pdfjs-dist` have introduced breaking changes that do not let us use the render to SVG feature, as it has been deprecated.

To ammend for the vulnerabilities present in this version, we have applied this patch:
For [malicious Javascript](https://github.com/advisories/GHSA-wgrm-67xf-hhpq), we have sanitized the PDF input via the [`ducpdf`](packages/ducpdf/src/duc2pdf/Cargo.toml) package before passing it to `ducsvg` by leveraging the `hipdf::embed_pdf` lib sanitizing features. 