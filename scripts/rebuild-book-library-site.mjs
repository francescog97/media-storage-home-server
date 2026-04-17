import { promises as fs } from "node:fs";
import path from "node:path";

const BOOK_ROOT = "G:\\My Drive\\04_Knowledge\\book-resources";
const OLD_ECOURSES_ROOT = "E:\\courses\\book-resources";
const NEW_ECOURSES_ROOT = "E:\\[courses]\\book-resources";
const SITE_ROOT = path.join(BOOK_ROOT, "library-site");
const COVERS_ROOT = path.join(SITE_ROOT, "covers");
const DATA_ROOT = path.join(SITE_ROOT, "data");
const BASE_CATALOG = path.join(DATA_ROOT, "book-library-catalog.json");
const IMPORT_MANIFEST = "E:\\[courses]\\book-resources\\_reports\\calibre-tech-migration-manifest.json";
const E_SITE_ROOT = "E:\\[courses]\\book-resources\\library-site";

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

function normalizeECoursesPath(filePath) {
  const value = String(filePath ?? "");
  return value.startsWith(OLD_ECOURSES_ROOT)
    ? value.replace(OLD_ECOURSES_ROOT, NEW_ECOURSES_ROOT)
    : value;
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

async function statSafe(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "codex-book-library/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function tokenScore(queryTitle, candidateTitle = "") {
  const wanted = [...new Set(normalizeTitle(queryTitle).split(" ").filter(Boolean))];
  const candidate = [...new Set(normalizeTitle(candidateTitle).split(" ").filter(Boolean))];
  if (!wanted.length || !candidate.length) {
    return 0;
  }
  let matches = 0;
  for (const token of wanted) {
    if (candidate.includes(token)) {
      matches += 1;
    }
  }
  return matches / wanted.length;
}

async function fetchCover(book) {
  const fileName = `${slugify(book.title)}.jpg`;
  const localPath = path.join(COVERS_ROOT, fileName);
  const query = encodeURIComponent(book.author ? `${book.title} ${book.author}` : book.title);

  const strategies = [
    async () => {
      const data = await getJson(`https://openlibrary.org/search.json?limit=6&title=${query}`);
      const docs = Array.isArray(data?.docs) ? data.docs : [];
      return docs
        .filter((doc) => doc.cover_i && doc.title)
        .map((doc) => ({
          score: tokenScore(book.title, doc.title),
          pageUrl: doc.key ? `https://openlibrary.org${doc.key}` : "https://openlibrary.org",
          imageUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        }))
        .sort((left, right) => right.score - left.score)[0] ?? null;
    },
    async () => {
      const data = await getJson(`https://www.googleapis.com/books/v1/volumes?maxResults=5&q=${query}`);
      const items = Array.isArray(data?.items) ? data.items : [];
      return items
        .filter((item) => item.volumeInfo?.title && item.volumeInfo?.imageLinks)
        .map((item) => ({
          score: tokenScore(book.title, item.volumeInfo.title),
          pageUrl: item.volumeInfo.infoLink || item.selfLink || "https://books.google.com",
          imageUrl: (item.volumeInfo.imageLinks.thumbnail || item.volumeInfo.imageLinks.smallThumbnail || "").replace("http://", "https://")
        }))
        .filter((item) => item.imageUrl)
        .sort((left, right) => right.score - left.score)[0] ?? null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (!result || result.score < 0.45) {
        continue;
      }
      const response = await fetch(result.imageUrl, {
        headers: {
          "user-agent": "codex-book-library/1.0",
          referer: result.pageUrl
        }
      });
      if (!response.ok) {
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 4096) {
        continue;
      }
      await fs.writeFile(localPath, buffer);
      return {
        coverLocalPath: `./covers/${fileName}`,
        coverSourceUrl: result.pageUrl,
        coverProvider: result.imageUrl.includes("openlibrary") ? "openlibrary" : "google-books"
      };
    } catch {
      continue;
    }
  }

  return {
    coverLocalPath: null,
    coverSourceUrl: null,
    coverProvider: null
  };
}

async function copyDirectory(sourceDir, destinationDir) {
  await ensureDir(destinationDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

function buildHtml(catalog) {
  const dataJson = JSON.stringify(catalog);
  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Book Resources Library</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      :root{--bg:#f5efe5;--panel:rgba(255,255,255,.86);--ink:#1f1f1c;--muted:#66685f;--line:rgba(31,31,28,.11);--accent:#15574e;--career:#9c4a18;--shadow:0 22px 56px rgba(41,34,21,.14)}
      *{box-sizing:border-box} body{margin:0;font-family:"Space Grotesk",system-ui,sans-serif;color:var(--ink);background:radial-gradient(circle at top left,rgba(21,87,78,.18),transparent 30%),radial-gradient(circle at top right,rgba(156,74,24,.16),transparent 26%),linear-gradient(180deg,#fbf7f0 0%,var(--bg) 100%)}
      .page{width:min(1240px,calc(100vw - 32px));margin:0 auto;padding:24px 0 56px}.hero,.toolbar,.panel{background:var(--panel);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow)}
      .hero{display:grid;grid-template-columns:1.35fr .9fr;gap:24px;padding:30px;margin-bottom:24px}.eyebrow{margin:0 0 10px;color:var(--accent);font-size:.84rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
      h1,h2{margin:0;font-family:"Fraunces",serif;line-height:.95} h1{font-size:clamp(2.6rem,6vw,4.5rem);max-width:13ch}.lede{margin:16px 0 0;max-width:60ch;color:var(--muted);line-height:1.6}
      .stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.stat{padding:18px;border-radius:22px;background:rgba(255,255,255,.92);border:1px solid var(--line)} .stat span{display:block;font-size:.82rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em} .stat strong{display:block;margin-top:8px;font-size:1.55rem;font-family:"Fraunces",serif}
      .toolbar{padding:20px;margin-bottom:24px}.toolbar-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:14px} label{display:grid;gap:8px;color:var(--muted);font-size:.88rem} input{width:100%;min-height:50px;border-radius:16px;border:1px solid var(--line);padding:0 16px;font:inherit;background:#fff}
      .tag-strip{display:flex;flex-wrap:wrap;gap:10px}.tag-button{min-height:42px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.86);font:inherit;font-weight:700;cursor:pointer}.tag-button.is-active{background:var(--accent);color:#fff;border-color:transparent}.tag-button[data-tag="career-business"].is-active,.tag-button[data-tag="ai-business"].is-active{background:var(--career)}
      .panel{padding:24px}.section-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:18px}.section-meta{margin:0;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
      .card{display:grid;grid-template-rows:auto 1fr;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:22px;overflow:hidden}.cover{position:relative;aspect-ratio:3/4;background:linear-gradient(180deg,rgba(21,87,78,.17),rgba(21,87,78,.02)),linear-gradient(135deg,#efe3d4,#d8ebe4)} .card.career .cover{background:linear-gradient(180deg,rgba(156,74,24,.18),rgba(156,74,24,.04)),linear-gradient(135deg,#f2dfcf,#fbf2e7)} .cover img{width:100%;height:100%;object-fit:cover;display:block}.fallback{position:absolute;inset:0;display:grid;place-items:center;padding:18px;text-align:center;font-family:"Fraunces",serif;font-size:1.2rem}
      .pill{position:absolute;top:14px;left:14px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.9);font-size:.78rem;font-weight:700}.body{display:grid;gap:12px;padding:18px}.body h3{margin:0;font-size:1.05rem;line-height:1.25}.body p{margin:0;color:var(--muted)} .chips{display:flex;flex-wrap:wrap;gap:8px}.chip{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#d9efe9;color:var(--accent);font-size:.8rem}.chip.career{background:#f6e3d6;color:var(--career)}.meta{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:.88rem}.link{color:var(--accent);text-decoration:none;font-weight:700;font-size:.88rem}
      @media (max-width:900px){.hero,.toolbar-grid{grid-template-columns:1fr}}
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div><p class="eyebrow">Knowledge / Book Resources</p><h1>Libreria tecnica e career del tuo Drive</h1><p class="lede">Catalogo aggiornato con i titoli tecnici e career organizzati direttamente per categoria tra G: ed E:, senza raccolte separate.</p></div>
        <div class="stats">
          <div class="stat"><span>Libri totali</span><strong id="totalCount">-</strong></div>
          <div class="stat"><span>Informatica</span><strong id="technicalCount">-</strong></div>
          <div class="stat"><span>Career / Business</span><strong id="careerCount">-</strong></div>
          <div class="stat"><span>Copertine locali</span><strong id="coverCount">-</strong></div>
        </div>
      </section>
      <section class="toolbar">
        <div class="toolbar-grid">
          <label for="searchInput"><span>Cerca per titolo, autore o tag</span><input id="searchInput" type="search" placeholder="Es. python, git, ml, career"></label>
          <div class="tag-strip" id="tagStrip"></div>
        </div>
      </section>
      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Catalogo</p><h2>Libreria</h2></div><p class="section-meta" id="resultMeta">-</p></div>
        <div class="grid" id="grid"></div>
      </section>
    </div>
    <script>
      const catalog = ${dataJson};
      const state = { query: "", tag: "all" };
      const el = { totalCount: document.querySelector("#totalCount"), technicalCount: document.querySelector("#technicalCount"), careerCount: document.querySelector("#careerCount"), coverCount: document.querySelector("#coverCount"), tagStrip: document.querySelector("#tagStrip"), searchInput: document.querySelector("#searchInput"), resultMeta: document.querySelector("#resultMeta"), grid: document.querySelector("#grid") };
      const TAGS = [["all","Tutti"],["informatica","Informatica"],["ai-ml","AI / ML"],["software-engineering","Software Engineering"],["programming","Programming"],["systems-security","Systems / Security"],["data-statistics","Data / Statistics"],["career-business","Career / Business"],["ai-business","AI Business"],["job-search","Job Search"],["freelancing-business","Freelancing"]];
      const normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
      const escapeHtml = (value) => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
      function renderTags(){ el.tagStrip.innerHTML = TAGS.map(([key,label]) => \`<button class="tag-button \${state.tag===key ? "is-active" : ""}" data-tag="\${key}" type="button">\${label}</button>\`).join(""); el.tagStrip.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", () => { state.tag = button.dataset.tag; renderTags(); render(); })); }
      function matches(item){ const tagOk = state.tag === "all" || (item.tags ?? []).includes(state.tag); if(!tagOk) return false; if(!state.query) return true; return normalize([item.title,item.author,...(item.tags??[])].join(" ")).includes(normalize(state.query)); }
      function card(item){ const cover = item.coverLocalPath ? \`<img src="\${escapeHtml(item.coverLocalPath)}" alt="Copertina di \${escapeHtml(item.title)}" loading="lazy">\` : \`<div class="fallback">\${escapeHtml(item.title)}</div>\`; const chips = (item.tags ?? []).map((tag)=>\`<span class="chip \${tag.includes("career") || tag.includes("business") ? "career" : ""}">\${escapeHtml(tag)}</span>\`).join(""); const source = item.coverSourceUrl ? \`<a class="link" href="\${escapeHtml(item.coverSourceUrl)}" target="_blank" rel="noreferrer">Fonte copertina</a>\` : ""; return \`<article class="card \${item.kind === "career-business" ? "career" : ""}"><div class="cover"><span class="pill">\${item.kind === "career-business" ? "Career / Business" : "Informatica"}</span>\${cover}</div><div class="body"><div><h3>\${escapeHtml(item.title)}</h3><p>\${escapeHtml(item.author || "Autore non disponibile")}</p></div><div class="chips">\${chips}</div><div class="meta"><span>\${escapeHtml(item.extension.replace(".", "").toUpperCase())}</span><span>\${escapeHtml(item.sizeLabel)}</span></div>\${source}</div></article>\`; }
      function render(){ const items = catalog.books.filter(matches); el.grid.innerHTML = items.map(card).join(""); el.resultMeta.textContent = \`\${items.length} titoli visibili\`; }
      el.totalCount.textContent = catalog.summary.totalBooks; el.technicalCount.textContent = catalog.summary.technicalBooks; el.careerCount.textContent = catalog.summary.careerBooks; el.coverCount.textContent = catalog.summary.coverCount;
      el.searchInput.addEventListener("input", (event) => { state.query = event.target.value; render(); });
      renderTags(); render();
    </script>
  </body>
</html>`;
}

async function main() {
  await Promise.all([ensureDir(COVERS_ROOT), ensureDir(DATA_ROOT)]);

  const baseCatalog = await readJson(BASE_CATALOG, { books: [] });
  const manifest = await readJson(IMPORT_MANIFEST, { books: [] });

  const combined = [];
  const seen = new Set();

  for (const item of [...(baseCatalog.books ?? []), ...(manifest.books ?? [])]) {
    const sourcePath = normalizeECoursesPath(item.sourcePath ?? item.targetPath ?? item.eCoursesPath);
    const stats = await statSafe(sourcePath);
    if (!stats || !stats.isFile()) {
      continue;
    }

    const key = `${normalizeTitle(item.title)}::${stats.size}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    combined.push({
      title: htmlDecode(item.title),
      author: htmlDecode(item.author ?? ""),
      kind: item.kind ?? "technical",
      tags: Array.from(new Set(item.tags ?? [])),
      extension: item.extension ?? path.extname(sourcePath).toLowerCase(),
      sizeLabel: item.sizeLabel ?? (() => {
        const units = ["B", "KB", "MB", "GB"];
        let value = stats.size;
        let index = 0;
        while (value >= 1024 && index < units.length - 1) {
          value /= 1024;
          index += 1;
        }
        return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
      })(),
      sizeBytes: stats.size,
      sourcePath,
      eCoursesPath: normalizeECoursesPath(item.eCoursesPath ?? sourcePath),
      origin: item.origin ?? "canonical",
      coverLocalPath: item.coverLocalPath ?? null,
      coverSourceUrl: item.coverSourceUrl ?? null,
      coverProvider: item.coverProvider ?? null
    });
  }

  for (const book of combined) {
    const cachedCoverFile = `${slugify(book.title)}.jpg`;
    const cachedCoverPath = path.join(COVERS_ROOT, cachedCoverFile);
    if (!book.coverLocalPath && await statSafe(cachedCoverPath)) {
      book.coverLocalPath = `./covers/${cachedCoverFile}`;
      book.coverProvider = book.coverProvider ?? "cached";
    }
    if (book.coverLocalPath) {
      const coverPath = path.join(COVERS_ROOT, path.basename(book.coverLocalPath));
      if (await statSafe(coverPath)) {
        continue;
      }
    }
    const cover = await fetchCover(book);
    book.coverLocalPath = cover.coverLocalPath;
    book.coverSourceUrl = cover.coverSourceUrl;
    book.coverProvider = cover.coverProvider;
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalBooks: combined.length,
      technicalBooks: combined.filter((book) => book.kind === "technical").length,
      careerBooks: combined.filter((book) => book.kind === "career-business").length,
      coverCount: combined.filter((book) => book.coverLocalPath).length
    },
    books: combined.sort((left, right) => left.title.localeCompare(right.title, "it"))
  };

  await writeJson(BASE_CATALOG, catalog);
  await fs.writeFile(path.join(SITE_ROOT, "index.html"), buildHtml(catalog), "utf8");
  await copyDirectory(SITE_ROOT, E_SITE_ROOT);
  console.log(JSON.stringify(catalog.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
