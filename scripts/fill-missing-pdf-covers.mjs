import { promises as fs } from "node:fs";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const BOOK_ROOT = "G:\\My Drive\\04_Knowledge\\book-resources";
const CATALOG_PATH = path.join(BOOK_ROOT, "library-site", "data", "book-library-catalog.json");
const COVERS_ROOT = path.join(BOOK_ROOT, "library-site", "covers");

function htmlDecode(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00e2\u201a\u00ac/g, "\u20ac")
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .trim();
}

function slugify(value) {
  return htmlDecode(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function statSafe(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function renderPdfCover(pdfPath, outputPath) {
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const doc = await pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false
  }).promise;

  try {
    const page = await doc.getPage(1);
    const firstViewport = page.getViewport({ scale: 1 });
    const targetWidth = 900;
    const scale = Math.max(1, targetWidth / Math.max(firstViewport.width, 1));
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    await fs.writeFile(outputPath, canvas.toBuffer("image/jpeg"));
  } finally {
    await doc.destroy();
  }
}

async function main() {
  await fs.mkdir(COVERS_ROOT, { recursive: true });

  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  const missingPdfs = (catalog.books ?? []).filter((book) => {
    const sourcePath = String(book.sourcePath ?? "");
    return !book.coverLocalPath && String(book.extension ?? "").toLowerCase() === ".pdf" && sourcePath;
  });

  const summary = {
    totalCandidates: missingPdfs.length,
    generated: [],
    skippedExisting: [],
    failed: []
  };

  for (const book of missingPdfs) {
    const pdfPath = String(book.sourcePath ?? "");
    const coverPath = path.join(COVERS_ROOT, `${slugify(book.title)}.jpg`);

    if (!(await statSafe(pdfPath))) {
      summary.failed.push({ title: book.title, reason: "Source PDF not found", pdfPath });
      continue;
    }

    if (await statSafe(coverPath)) {
      summary.skippedExisting.push({ title: book.title, coverPath });
      continue;
    }

    try {
      await renderPdfCover(pdfPath, coverPath);
      summary.generated.push({ title: book.title, pdfPath, coverPath });
    } catch (error) {
      summary.failed.push({
        title: book.title,
        pdfPath,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(JSON.stringify({
    totalCandidates: summary.totalCandidates,
    generated: summary.generated.length,
    skippedExisting: summary.skippedExisting.length,
    failed: summary.failed.length
  }, null, 2));

  if (summary.failed.length) {
    console.log(JSON.stringify(summary.failed, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
