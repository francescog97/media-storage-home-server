import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CALIBREDB = "C:\\Program Files\\Calibre2\\calibredb.exe";
const BOOK_ROOT = "G:\\My Drive\\04_Knowledge\\book-resources";
const REPORT_ROOT = path.join(BOOK_ROOT, "_reports");
const CATALOG_JSON = path.join(BOOK_ROOT, "library-site", "data", "book-library-catalog.json");
const ECOURSES_ROOT = "E:\\[courses]\\book-resources";
const ECOURSES_REPORT_ROOT = path.join(ECOURSES_ROOT, "_reports");
const MANIFEST_PATH = path.join(ECOURSES_REPORT_ROOT, "calibre-tech-migration-manifest.json");
const REPORT_JSON = path.join(REPORT_ROOT, "calibre-tech-migration-report.json");
const REPORT_MD = path.join(REPORT_ROOT, "calibre-tech-migration-report.md");

const EXT_PRIORITY = [".pdf", ".epub", ".azw3", ".mobi", ".djvu", ".docx", ".doc"];

const LIBRARIES = {
  Library: {
    path: "C:\\Users\\Franc\\Documents\\CalibreLibraries\\Library",
    candidates: {
      65: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "algorithms"] },
      81: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "career-business"] },
      259: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "open-source"] },
      854: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering"] },
      866: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "career-business", "interviews"] },
      874: { kind: "career-business", categoryPath: ["career-business", "ai-business"], tags: ["career-business", "ai-business", "ai-ml"] },
      880: { kind: "career-business", categoryPath: ["career-business", "ai-business"], tags: ["career-business", "ai-business", "ai-ml"] },
      920: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "python", "security"] },
      957: { kind: "technical", categoryPath: ["technical", "ai-ml"], tags: ["informatica", "ai-ml", "deep-learning"] },
      960: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      961: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "android"] },
      986: { kind: "technical", categoryPath: ["technical", "ai-ml"], tags: ["informatica", "ai-ml", "artificial-intelligence"] },
      988: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "dotnet"] },
      1001: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "c"] },
      1008: { kind: "technical", categoryPath: ["technical", "ai-ml"], tags: ["informatica", "ai-ml", "math"] },
      1011: { kind: "technical", categoryPath: ["technical", "ai-ml"], tags: ["informatica", "ai-ml", "dotnet"] },
      1014: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "git"] },
      1022: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "java"] },
      1023: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "java"] },
      1027: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python", "data-science"] },
      1030: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python", "data-science"] },
      1034: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "security"] },
      1047: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "functional-programming"] },
      1056: { kind: "technical", categoryPath: ["technical", "software-engineering"], tags: ["informatica", "software-engineering", "algorithms"] },
      1096: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "security", "networking"] }
    }
  },
  Manuali: {
    path: "C:\\Users\\Franc\\Documents\\CalibreLibraries\\Manuali",
    candidates: {
      5: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "android"] },
      6: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "android"] },
      7: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "android", "security"] },
      8: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "php", "sql"] },
      27: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "web-development", "css"] },
      30: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      32: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "web-development", "jquery"] },
      36: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "web-development", "html"] },
      62: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "networking"] },
      66: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "networking", "security"] },
      98: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "security", "privacy"] },
      100: { kind: "technical", categoryPath: ["technical", "systems-security"], tags: ["informatica", "systems-security", "security"] },
      112: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      113: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      114: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      116: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      117: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "android", "java"] },
      118: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] },
      119: { kind: "technical", categoryPath: ["technical", "programming"], tags: ["informatica", "programming", "python"] }
    }
  }
};

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

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function listOpfFiles(rootPath) {
  const queue = [rootPath];
  const results = [];
  while (queue.length) {
    const current = queue.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile() && entry.name === "metadata.opf") {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function parseMetadata(raw) {
  const title = raw.match(/<dc:title>([\s\S]*?)<\/dc:title>/i)?.[1] ?? "";
  const authors = [...raw.matchAll(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/gi)].map((match) => htmlDecode(match[1]));
  const subjects = [...raw.matchAll(/<dc:subject>([\s\S]*?)<\/dc:subject>/gi)].map((match) => htmlDecode(match[1]));
  return {
    title: htmlDecode(title),
    authors,
    subjects
  };
}

async function scanLibrary(libraryName, config) {
  const wanted = new Set(Object.keys(config.candidates));
  const found = new Map();
  const opfFiles = await listOpfFiles(config.path);

  for (const opfPath of opfFiles) {
    const parentDir = path.dirname(opfPath);
    const folderName = path.basename(parentDir);
    const idMatch = folderName.match(/\((\d+)\)$/);
    if (!idMatch || !wanted.has(idMatch[1])) {
      continue;
    }

    const raw = await fs.readFile(opfPath, "utf8");
    const metadata = parseMetadata(raw);
    const siblingFiles = await fs.readdir(parentDir, { withFileTypes: true });
    const formats = siblingFiles
      .filter((entry) => entry.isFile() && entry.name !== "metadata.opf")
      .map((entry) => path.join(parentDir, entry.name))
      .filter((filePath) => EXT_PRIORITY.includes(path.extname(filePath).toLowerCase()));

    found.set(Number(idMatch[1]), {
      libraryName,
      libraryPath: config.path,
      calibreId: Number(idMatch[1]),
      title: metadata.title,
      authors: metadata.authors,
      subjects: metadata.subjects,
      folderPath: parentDir,
      formatPaths: formats
    });
  }

  return found;
}

function choosePreferredFormat(formatPaths) {
  const sorted = [...formatPaths].sort((left, right) => {
    const leftIndex = EXT_PRIORITY.indexOf(path.extname(left).toLowerCase());
    const rightIndex = EXT_PRIORITY.indexOf(path.extname(right).toLowerCase());
    return leftIndex - rightIndex;
  });
  return sorted[0] ?? null;
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

async function copyFileSafe(sourcePath, destinationPath) {
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

async function buildDedupeInventory() {
  const keys = new Set();
  const baseCatalog = await readJson(CATALOG_JSON, { books: [] });
  const manifest = await readJson(MANIFEST_PATH, { books: [] });

  for (const item of [...(baseCatalog.books ?? []), ...(manifest.books ?? [])]) {
    const candidatePath = item.sourcePath ?? item.targetPath ?? item.eCoursesPath;
    const stats = await statSafe(candidatePath);
    if (!stats || !stats.isFile()) {
      continue;
    }
    keys.add(`${normalizeTitle(item.title)}::${stats.size}`);
  }

  return {
    dedupeKeys: keys,
    existingManifest: manifest
  };
}

async function removeFromCalibre(libraryPath, calibreId) {
  try {
    await execFileAsync(CALIBREDB, ["remove", "--with-library", libraryPath, "--permanent", String(calibreId)], {
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: (error.stderr || error.message || "Unknown calibredb error").trim()
    };
  }
}

async function main() {
  await Promise.all([ensureDir(ECOURSES_ROOT), ensureDir(ECOURSES_REPORT_ROOT), ensureDir(REPORT_ROOT)]);

  const scanned = new Map();
  for (const [libraryName, config] of Object.entries(LIBRARIES)) {
    scanned.set(libraryName, await scanLibrary(libraryName, config));
  }

  const { dedupeKeys, existingManifest } = await buildDedupeInventory();
  const existingByRef = new Map(
    (existingManifest.books ?? []).map((item) => [`${item.libraryName}:${item.calibreId}`, item])
  );

  const report = {
    generatedAt: new Date().toISOString(),
    libraryRoot: ECOURSES_ROOT,
    removedFromCalibre: [],
    movedToLibrary: [],
    skippedAsDuplicate: [],
    missingInCalibre: [],
    removeFailures: []
  };

  const manifestBooks = [];

  for (const [libraryName, config] of Object.entries(LIBRARIES)) {
    const entries = scanned.get(libraryName);
    for (const [idText, candidate] of Object.entries(config.candidates)) {
      const calibreId = Number(idText);
      const ref = `${libraryName}:${calibreId}`;
      const existing = existingByRef.get(ref);
      if (existing && (await exists(existing.sourcePath))) {
        manifestBooks.push(existing);
        continue;
      }

      const entry = entries.get(calibreId);
      if (!entry) {
        report.missingInCalibre.push({ libraryName, calibreId });
        continue;
      }

      const preferredFile = choosePreferredFormat(entry.formatPaths);
      if (!preferredFile) {
        report.missingInCalibre.push({ libraryName, calibreId, reason: "No supported format" });
        continue;
      }

      const stats = await fs.stat(preferredFile);
      const dedupeKey = `${normalizeTitle(entry.title)}::${stats.size}`;
      const shouldSkipCopy = dedupeKeys.has(dedupeKey);

      let destinationPath = null;
      if (!shouldSkipCopy) {
        const ext = path.extname(preferredFile).toLowerCase();
        const destination = path.join(ECOURSES_ROOT, ...candidate.categoryPath, `${slugify(entry.title)}${ext}`);
        destinationPath = await ensureUniqueDestination(destination, stats.size);
        await copyFileSafe(preferredFile, destinationPath);
        dedupeKeys.add(dedupeKey);
        report.movedToLibrary.push({
          libraryName,
          calibreId,
          title: entry.title,
          from: preferredFile,
          to: destinationPath
        });
      } else {
        report.skippedAsDuplicate.push({
          libraryName,
          calibreId,
          title: entry.title,
          duplicateRule: "same normalized title + same file size"
        });
      }

      const removal = await removeFromCalibre(entry.libraryPath, calibreId);
      if (removal.ok) {
        report.removedFromCalibre.push({ libraryName, calibreId, title: entry.title });
      } else {
        report.removeFailures.push({ libraryName, calibreId, title: entry.title, error: removal.error });
      }

      if (destinationPath) {
        manifestBooks.push({
          libraryName,
          calibreId,
          title: entry.title,
          author: entry.authors.join(", "),
          kind: candidate.kind,
          tags: candidate.tags,
          categoryPath: candidate.categoryPath,
          sourcePath: destinationPath,
          eCoursesPath: destinationPath,
          sizeBytes: stats.size,
          sizeLabel: formatBytes(stats.size),
          extension: path.extname(destinationPath).toLowerCase(),
          originalFormats: entry.formatPaths.map((filePath) => path.basename(filePath)),
          origin: "calibre"
        });
      }
    }
  }

  const mergedManifest = {
    generatedAt: new Date().toISOString(),
    books: manifestBooks.sort((left, right) => left.title.localeCompare(right.title, "it"))
  };

  await writeJson(MANIFEST_PATH, mergedManifest);
  await writeJson(REPORT_JSON, report);
  await fs.writeFile(
    REPORT_MD,
    [
      "# Calibre Tech Migration",
      "",
      `Generated at: ${report.generatedAt}`,
      "",
      `Moved to library: ${report.movedToLibrary.length}`,
      `Skipped as duplicate: ${report.skippedAsDuplicate.length}`,
      `Removed from calibre: ${report.removedFromCalibre.length}`,
      `Remove failures: ${report.removeFailures.length}`,
      "",
      "## Library Root",
      `- ${ECOURSES_ROOT}`,
      "",
      "## Manifest",
      `- ${MANIFEST_PATH}`
    ].join("\n"),
    "utf8"
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
