import { promises as fs } from "node:fs";
import path from "node:path";

const BOOK_ROOT = "G:\\My Drive\\04_Knowledge\\book-resources";
const CATALOG_JSON = path.join(BOOK_ROOT, "library-site", "data", "book-library-catalog.json");
const ECOURSES_ROOT = "E:\\[courses]\\book-resources";
const LEGACY_ROOT = path.join(ECOURSES_ROOT, "from-calibre");
const LEGACY_MANIFEST = path.join(LEGACY_ROOT, "from-calibre-manifest.json");
const REPORT_ROOT = path.join(ECOURSES_ROOT, "_reports");
const MANIFEST_PATH = path.join(REPORT_ROOT, "calibre-tech-migration-manifest.json");

function htmlDecode(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00e2\u201a\u00ac/g, "\u20ac")
    .trim();
}

function normalizeTitle(value) {
  return htmlDecode(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
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

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function statSafe(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function ensureUniqueDestination(destinationPath, sizeBytes) {
  if (!(await exists(destinationPath))) {
    return destinationPath;
  }

  const existingStats = await statSafe(destinationPath);
  if (existingStats && existingStats.size === sizeBytes) {
    return destinationPath;
  }

  const parsed = path.parse(destinationPath);
  let counter = 2;
  let candidate = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`);
  while (await exists(candidate)) {
    counter += 1;
    candidate = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`);
  }
  return candidate;
}

async function moveFile(sourcePath, destinationPath) {
  await ensureDir(path.dirname(destinationPath));
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) {
    return;
  }
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch {
    await fs.copyFile(sourcePath, destinationPath);
    await fs.unlink(sourcePath);
  }
}

async function removeEmptyDirectories(rootPath) {
  if (!(await exists(rootPath))) {
    return;
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await removeEmptyDirectories(path.join(rootPath, entry.name));
    }
  }

  const remaining = await fs.readdir(rootPath);
  if (!remaining.length) {
    await fs.rmdir(rootPath);
  }
}

async function deleteIfExists(targetPath) {
  if (await exists(targetPath)) {
    await fs.unlink(targetPath);
  }
}

async function buildCanonicalDedupeKeys() {
  const catalog = await readJson(CATALOG_JSON, { books: [] });
  const keys = new Set();

  for (const book of catalog.books ?? []) {
    const tags = Array.isArray(book.tags) ? book.tags : [];
    const sourcePath = String(book.sourcePath ?? "");
    const eCoursesPath = String(book.eCoursesPath ?? "");
    const isLegacyImport = sourcePath.startsWith(LEGACY_ROOT) || eCoursesPath.startsWith(LEGACY_ROOT) || tags.includes("from-calibre");
    if (isLegacyImport) {
      continue;
    }

    const sizeBytes = Number(book.sizeBytes ?? 0);
    if (!book.title || !sizeBytes) {
      continue;
    }
    keys.add(`${normalizeTitle(book.title)}::${sizeBytes}`);
  }

  return keys;
}

async function main() {
  const legacyManifest = await readJson(LEGACY_MANIFEST, { books: [] });
  if (!Array.isArray(legacyManifest.books) || !legacyManifest.books.length) {
    console.log(JSON.stringify({
      moved: 0,
      keptExisting: 0,
      removedAsDuplicate: 0,
      missingSources: 0,
      note: "No legacy from-calibre manifest found."
    }, null, 2));
    return;
  }

  await ensureDir(REPORT_ROOT);

  const canonicalDedupeKeys = await buildCanonicalDedupeKeys();
  const migratedBooks = [];
  const summary = {
    moved: [],
    keptExisting: [],
    removedAsDuplicate: [],
    missingSources: []
  };

  for (const item of legacyManifest.books) {
    const sourcePath = item.sourcePath ?? "";
    const sourceStats = await statSafe(sourcePath);
    const sizeBytes = sourceStats?.size ?? Number(item.sizeBytes ?? 0);
    const dedupeKey = `${normalizeTitle(item.title)}::${sizeBytes}`;

    if (canonicalDedupeKeys.has(dedupeKey)) {
      if (sourceStats?.isFile()) {
        await fs.unlink(sourcePath);
      }
      summary.removedAsDuplicate.push({
        title: item.title,
        sourcePath,
        duplicateRule: "same normalized title + same file size"
      });
      continue;
    }

    const extension = item.extension || path.extname(sourcePath).toLowerCase();
    const destinationBase = path.join(ECOURSES_ROOT, ...(item.categoryPath ?? []), `${slugify(item.title)}${extension}`);
    const destinationPath = await ensureUniqueDestination(destinationBase, sizeBytes);
    const destinationStats = await statSafe(destinationPath);

    if (destinationStats?.isFile() && destinationStats.size === sizeBytes) {
      if (sourceStats?.isFile() && path.resolve(sourcePath) !== path.resolve(destinationPath)) {
        await fs.unlink(sourcePath);
      }
      summary.keptExisting.push({
        title: item.title,
        destinationPath
      });
    } else if (sourceStats?.isFile()) {
      await moveFile(sourcePath, destinationPath);
      summary.moved.push({
        title: item.title,
        from: sourcePath,
        to: destinationPath
      });
    } else if (!(destinationStats?.isFile())) {
      summary.missingSources.push({
        title: item.title,
        sourcePath,
        attemptedDestination: destinationPath
      });
      continue;
    }

    const finalStats = await statSafe(destinationPath);
    if (!finalStats?.isFile()) {
      summary.missingSources.push({
        title: item.title,
        sourcePath,
        attemptedDestination: destinationPath
      });
      continue;
    }

    canonicalDedupeKeys.add(dedupeKey);
    const tags = Array.from(new Set((item.tags ?? []).filter((tag) => tag !== "from-calibre")));

    migratedBooks.push({
      libraryName: item.libraryName,
      calibreId: item.calibreId,
      title: item.title,
      author: item.author ?? "",
      kind: item.kind ?? "technical",
      tags,
      categoryPath: item.categoryPath ?? [],
      sourcePath: destinationPath,
      eCoursesPath: destinationPath,
      sizeBytes: finalStats.size,
      sizeLabel: formatBytes(finalStats.size),
      extension: path.extname(destinationPath).toLowerCase(),
      originalFormats: item.originalFormats ?? [],
      origin: "calibre"
    });
  }

  const nextManifest = {
    generatedAt: new Date().toISOString(),
    books: migratedBooks.sort((left, right) => left.title.localeCompare(right.title, "it"))
  };

  await writeJson(MANIFEST_PATH, nextManifest);
  await deleteIfExists(LEGACY_MANIFEST);
  await removeEmptyDirectories(LEGACY_ROOT);

  console.log(JSON.stringify({
    moved: summary.moved.length,
    keptExisting: summary.keptExisting.length,
    removedAsDuplicate: summary.removedAsDuplicate.length,
    missingSources: summary.missingSources.length,
    manifestPath: MANIFEST_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
