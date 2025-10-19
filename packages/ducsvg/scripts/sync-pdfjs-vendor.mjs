import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const SOURCE_DIR = path.resolve(ROOT_DIR, "node_modules/pdfjs-dist/legacy/build");
const TARGET_DIR = path.resolve(ROOT_DIR, "src/pdf2svg/vendor/pdfjs-dist");

const REQUIRED_FILES = [
  "pdf.js",
  "pdf.worker.min.js",
];

const copyFile = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const main = () => {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error("pdfjs-dist legacy build directory not found at", SOURCE_DIR);
    process.exit(1);
  }

  for (const fileName of REQUIRED_FILES) {
    const sourcePath = path.join(SOURCE_DIR, fileName);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Required pdfjs-dist asset ${fileName} not found.`);
      process.exit(1);
    }
    const targetPath = path.join(TARGET_DIR, fileName);
    copyFile(sourcePath, targetPath);
  }

  const licenseSrc = path.resolve(ROOT_DIR, "node_modules/pdfjs-dist/LICENSE");
  if (fs.existsSync(licenseSrc)) {
    copyFile(licenseSrc, path.join(TARGET_DIR, "LICENSE"));
  }

  console.log("pdfjs-dist vendor assets synchronized to", TARGET_DIR);
};

main();