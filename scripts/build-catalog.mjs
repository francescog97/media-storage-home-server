import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

const ROOT_DIR = process.cwd();
const SITE_DIR = path.join(ROOT_DIR, "site");
const DATA_DIR = path.join(SITE_DIR, "data");
const CATALOG_JSON_PATH = path.join(DATA_DIR, "catalog.json");
const CACHE_PATH = path.join(DATA_DIR, "enrichment-cache.json");
const RAW_SCAN_PATH = path.join(DATA_DIR, "raw-catalog.json");
const ARCHIVED_INVENTORY_PATH = path.join(DATA_DIR, "d-drive-media-inventory.json");
const MARKDOWN_PATH = path.join(ROOT_DIR, "catalogo-media.md");
const SCAN_SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "scan-media.ps1");
const execFileAsync = promisify(execFile);

const VIDEO_EXTENSIONS = new Set([
  ".mkv",
  ".mp4",
  ".avi",
  ".m4v",
  ".mov",
  ".wmv",
  ".ts",
  ".mpg",
  ".mpeg",
  ".webm"
]);

const IGNORED_DIR_NAMES = new Set([
  "subs",
  "sub",
  "subtitles",
  "samples",
  "sample",
  "deleted scenes",
  "featurettes",
  "extras",
  "other"
]);

const IGNORED_FILE_PATTERN = /\bsample\b|\btrailer\b|\bpreview\b/i;

const MOVIE_SEARCH_OVERRIDES = {
  "A.Big.Bold.Beautiful.Journey.2025.V2.1080p.TELESYNC.x264-SyncUP": ["A Big Bold Beautiful Journey"],
  "500 giorni insieme (2009)": ["500 giorni insieme", "(500) Days of Summer"],
  "Camp Rock Disney Channel (2008)": ["Camp Rock"],
  "Dalla Cina Con Furore Divx Vr@Nga Tntvillage (1972)": ["Dalla Cina con furore", "Fist of Fury"],
  "Easy Girl (2010)": ["Easy A"],
  "Gamer Dvdscr Sisolo (2010)": ["Gamer", "Gamer (2009 film)"],
  "I Mercenari 2 C0p Fuori Sincro (2012)": ["I mercenari 2", "The Expendables 2"],
  "Il lato positivo (2012)": ["Il lato positivo", "Silver Linings Playbook"],
  "Io prima di te (2016)": ["Io prima di te", "Me Before You"],
  "J Edgar Il Folle (2011)": ["J. Edgar"],
  "Lo Spaccacuori Hmy (2007)": ["The Heartbreak Kid (2007 film)"],
  "Minions R6 Race (2015)": ["Minions"],
  "Quasi amici (2011)": ["Quasi amici", "The Intouchables"],
  "Quo vado (2016)": ["Quo Vado?"],
  "Sky High (2005)": ["Sky High (2005 film)", "Sky High Kurt Russell"],
  "Spongebob Il Film": ["The SpongeBob SquarePants Movie"],
  "Superhero Il Più Dotato Fra I Supereroi": ["Superhero Movie"],
  "Tmnt Teenage Mutant Ninja Turtles Lions (2007)": ["TMNT (2007 film)"],
  "Tutti Vogliono Qualcosa (2016)": ["Everybody Wants Some!!"],
  "Una Notte Al Museo (2006)": ["Night at the Museum"]
};

const SERIES_SEARCH_OVERRIDES = {
  "Money Heist": ["La Casa de Papel", "Money Heist"],
  "Myhero2": ["My Hero Academia"],
  "Steins Gate Zero": ["Steins;Gate 0", "Steins Gate Zero"]
};

const FETCH_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
  accept: "application/json"
};

function slugify(value) {
  return normalizeForCompare(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function normalizeForCompare(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function formatRootList(roots) {
  const items = ensureArray(roots).filter(Boolean);
  if (!items.length) {
    return "nessuna sorgente disponibile";
  }
  return items.map((item) => `\`${item}\``).join(", ");
}

function sortSeasons(seasons) {
  return [...seasons].sort((left, right) => {
    if (left.seasonNumber == null) {
      return 1;
    }
    if (right.seasonNumber == null) {
      return -1;
    }
    return left.seasonNumber - right.seasonNumber;
  });
}

function prettifyTitle(rawTitle) {
  let title = String(rawTitle ?? "").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();

  const technicalTail = /\b(?:2160p|1080p|720p|480p|blu[- ]?ray|brrip|web[- ]?dl|webrip|hdrip|dvdscr|telesync|cam|x264|x265|h264|hevc|aac|ac3|ddp\d(?:\.\d)?|amzn|nf|dsnp|proper|rerip|galaxytv|ettv|tgx|syncup)\b.*$/i;
  title = title.replace(technicalTail, "").trim();

  const yearWithTail = title.match(/^(.*?)[\s._-]+((?:19|20)\d{2})\b(?:\s+v\d+)?(?:\s+.*)?$/i);
  if (yearWithTail && !/\(\d{4}\)/.test(title)) {
    title = `${yearWithTail[1].trim()} (${yearWithTail[2]})`;
  }

  title = title
    .replace(/\s+-\s+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return title;
}

function extractYear(title) {
  const match = String(title ?? "").match(/\((\d{4})\)|\b((?:19|20)\d{2})\b/);
  if (!match) {
    return null;
  }
  return Number(match[1] || match[2]);
}

function createRangeLabel(values, prefix = "E") {
  if (!values.length) {
    return "";
  }

  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    parts.push(start === previous
      ? `${prefix}${String(start).padStart(2, "0")}`
      : `${prefix}${String(start).padStart(2, "0")}-${prefix}${String(previous).padStart(2, "0")}`);

    start = current;
    previous = current;
  }

  parts.push(start === previous
    ? `${prefix}${String(start).padStart(2, "0")}`
    : `${prefix}${String(start).padStart(2, "0")}-${prefix}${String(previous).padStart(2, "0")}`);

  return parts.join(", ");
}

function parseEpisodeInfo(text) {
  const source = String(text ?? "");
  const seasonEpisodeMatch = source.match(/s(?<season>\d{1,2})e(?<episode>\d{1,3})/i);
  if (seasonEpisodeMatch) {
    return {
      season: Number(seasonEpisodeMatch.groups.season),
      episode: Number(seasonEpisodeMatch.groups.episode)
    };
  }

  const altSeasonEpisodeMatch = source.match(/\b(?<season>\d{1,2})x(?<episode>\d{1,3})\b/i);
  if (altSeasonEpisodeMatch) {
    return {
      season: Number(altSeasonEpisodeMatch.groups.season),
      episode: Number(altSeasonEpisodeMatch.groups.episode)
    };
  }

  const episodeMatch = source.match(/\bep(?:isode)?[ ._-]?(?<episode>\d{1,3})\b/i);
  if (!episodeMatch) {
    return null;
  }

  const seasonMatch = source.match(/(?:season|stagione)[ ._-]?(?<season>\d{1,2})|(?:^|\\)s(?<shortSeason>\d{1,2})(?:\\|$)/i);
  return {
    season: seasonMatch ? Number(seasonMatch.groups.season || seasonMatch.groups.shortSeason) : null,
    episode: Number(episodeMatch.groups.episode)
  };
}

function buildMovieSearchQueries(movie) {
  if (MOVIE_SEARCH_OVERRIDES[movie.title]) {
    return MOVIE_SEARCH_OVERRIDES[movie.title];
  }

  const queries = new Set();
  const year = extractYear(movie.title);
  const baseTitle = movie.title.replace(/\((\d{4})\)/g, "").trim();
  queries.add(baseTitle);
  queries.add(movie.title);

  if (year) {
    queries.add(`${baseTitle} ${year} film`);
    queries.add(`${baseTitle} ${year}`);
  } else {
    queries.add(`${baseTitle} film`);
  }

  return [...queries];
}

function buildSeriesSearchQueries(series) {
  if (SERIES_SEARCH_OVERRIDES[series.title]) {
    return SERIES_SEARCH_OVERRIDES[series.title];
  }

  return [series.title];
}

async function ensureDataDirectory() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonIfExists(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function safeReaddir(directoryPath) {
  try {
    return await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function shouldIgnoreDirectory(name) {
  return IGNORED_DIR_NAMES.has(name.toLowerCase());
}

function shouldIgnoreFile(fileName) {
  return fileName.startsWith("._") || IGNORED_FILE_PATTERN.test(fileName);
}

function isVideoFile(fileName) {
  return VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

async function walkVideoFiles(rootPath) {
  const collected = [];

  async function walk(currentPath) {
    const entries = await safeReaddir(currentPath);
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (shouldIgnoreDirectory(entry.name)) {
          continue;
        }
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!isVideoFile(entry.name) || shouldIgnoreFile(entry.name)) {
        continue;
      }

      collected.push({
        name: entry.name,
        fullPath,
        directoryPath: currentPath
      });
    }
  }

  await walk(rootPath);
  return collected;
}

function deriveMovieTitleFromFile(file) {
  return prettifyTitle(path.basename(file.directoryPath));
}

function deriveSeriesTitleFromAnomaly(file, rootPath) {
  const relativeDirectory = path.relative(rootPath, file.directoryPath);
  const seed = relativeDirectory && relativeDirectory !== "." ? path.basename(file.directoryPath) : path.parse(file.name).name;
  return prettifyTitle(
    seed
      .replace(/\bs\d{1,2}e\d{1,3}\b/gi, "")
      .replace(/\b\d{1,2}x\d{1,3}\b/gi, "")
      .replace(/\bep(?:isode)?[ ._-]?\d{1,3}\b/gi, "")
      .replace(/\bseason[ ._-]?\d{1,2}\b/gi, "")
      .trim()
  );
}

function addMovie(movieMap, title, tag) {
  const key = slugify(title);
  if (!movieMap.has(key)) {
    movieMap.set(key, {
      key,
      title,
      tags: new Set(),
      notes: new Set()
    });
  }

  if (tag) {
    movieMap.get(key).tags.add(tag);
  }
}

function addSeriesEpisode(seriesMap, title, episodeInfo, explicitIncomplete = false) {
  const key = slugify(title);
  if (!seriesMap.has(key)) {
    seriesMap.set(key, {
      key,
      title,
      seasons: new Map()
    });
  }

  const seasonKey = episodeInfo.season == null ? "?" : String(episodeInfo.season).padStart(2, "0");
  if (!seriesMap.get(key).seasons.has(seasonKey)) {
    seriesMap.get(key).seasons.set(seasonKey, {
      seasonNumber: episodeInfo.season,
      episodes: new Set(),
      explicitIncomplete
    });
  }

  const season = seriesMap.get(key).seasons.get(seasonKey);
  season.episodes.add(episodeInfo.episode);
  season.explicitIncomplete = season.explicitIncomplete || explicitIncomplete;
}

function collapseSplitMovies(movieEntries) {
  const groups = new Map();
  const consumed = new Set();

  for (const movie of movieEntries) {
    const match = movie.title.match(/^(.*\(\d{4}\)) Part (\d+)$/i);
    if (!match) {
      continue;
    }

    const key = slugify(match[1]);
    if (!groups.has(key)) {
      groups.set(key, {
        title: match[1],
        parts: [],
        tags: new Set()
      });
    }

    groups.get(key).parts.push(Number(match[2]));
    for (const tag of movie.tags) {
      groups.get(key).tags.add(tag);
    }
    consumed.add(movie.key);
  }

  const merged = [];
  for (const movie of movieEntries) {
    if (!consumed.has(movie.key)) {
      merged.push(movie);
      continue;
    }

    const splitKey = slugify(movie.title.replace(/ Part \d+$/i, ""));
    if (!groups.has(splitKey)) {
      merged.push(movie);
      continue;
    }

    if (groups.get(splitKey).emitted) {
      continue;
    }

    const groupedMovie = groups.get(splitKey);
    groupedMovie.emitted = true;
    merged.push({
      key: slugify(groupedMovie.title),
      title: groupedMovie.title,
      tags: [...groupedMovie.tags].sort(),
      notes: [`archiviato in ${groupedMovie.parts.sort((a, b) => a - b).length} parti`]
    });
  }

  return merged.map((movie) => ({
    key: movie.key,
    title: movie.title,
    tags: [...(movie.tags instanceof Set ? movie.tags : movie.tags ?? [])].sort(),
    notes: [...(movie.notes instanceof Set ? movie.notes : movie.notes ?? [])]
  }));
}

async function scanLibrary() {
  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        SCAN_SCRIPT_PATH
      ],
      {
        cwd: ROOT_DIR,
        maxBuffer: 20 * 1024 * 1024
      }
    );

    const payload = JSON.parse(stdout.trim());
    await writeJson(RAW_SCAN_PATH, payload);

    const movies = collapseSplitMovies(
      ensureArray(payload.movies).map((movie) => ({
        key: slugify(movie.title),
        title: movie.title,
        tags: movie.tags ?? [],
        notes: movie.notes ?? []
      }))
    ).sort((left, right) => left.title.localeCompare(right.title, "it"));

    const series = ensureArray(payload.series)
      .map((entry) => ({
        key: slugify(entry.title),
        title: entry.title,
        seasons: ensureArray(entry.seasons)
          .map((season) => ({
            seasonNumber: season.seasonNumber,
            episodes: ensureArray(season.episodes).map(Number).sort((left, right) => left - right),
            explicitIncomplete: season.explicitIncomplete
          }))
          .sort((left, right) => {
            if (left.seasonNumber == null) {
              return 1;
            }
            if (right.seasonNumber == null) {
              return -1;
            }
            return left.seasonNumber - right.seasonNumber;
          })
      }))
      .sort((left, right) => left.title.localeCompare(right.title, "it"));

    return {
      sourceRoots: ensureArray(payload.sourceRoots),
      movies,
      series
    };
  } catch (scanError) {
    const rawCatalog = await readJsonIfExists(RAW_SCAN_PATH, null);
    if (rawCatalog?.movies?.length || rawCatalog?.series?.length) {
      const movies = collapseSplitMovies(
        ensureArray(rawCatalog.movies).map((movie) => ({
          key: slugify(movie.title),
          title: movie.title,
          tags: ensureArray(movie.tags),
          notes: ensureArray(movie.notes)
        }))
      ).sort((left, right) => left.title.localeCompare(right.title, "it"));

      const series = ensureArray(rawCatalog.series)
        .map((entry) => ({
          key: slugify(entry.title),
          title: entry.title,
          seasons: ensureArray(entry.seasons)
            .map((season) => ({
              seasonNumber: season.seasonNumber,
              episodes: ensureArray(season.episodes).map(Number).sort((left, right) => left - right),
              explicitIncomplete: season.explicitIncomplete
            }))
            .sort((left, right) => {
              if (left.seasonNumber == null) {
                return 1;
              }
              if (right.seasonNumber == null) {
                return -1;
              }
              return left.seasonNumber - right.seasonNumber;
            })
        }))
        .sort((left, right) => left.title.localeCompare(right.title, "it"));

      return {
        sourceRoots: ensureArray(rawCatalog.sourceRoots),
        movies,
        series
      };
    }

    throw scanError;
  }
}

async function mergeArchivedInventory(scan) {
  const archivedInventory = await readJsonIfExists(ARCHIVED_INVENTORY_PATH, null);
  if (!archivedInventory?.series?.length) {
    return {
      ...scan,
      offlineSources: []
    };
  }

  const seriesMap = new Map(
    scan.series.map((series) => [
      series.key,
      {
        ...series,
        seasons: series.seasons.map((season) => ({
          seasonNumber: season.seasonNumber,
          episodes: [...season.episodes],
          explicitIncomplete: Boolean(season.explicitIncomplete)
        }))
      }
    ])
  );

  const offlineSources = [];

  for (const archivedSeries of ensureArray(archivedInventory.series)) {
    const seriesKey = slugify(archivedSeries.title);
    const current = seriesMap.get(seriesKey) ?? {
      key: seriesKey,
      title: archivedSeries.title,
      seasons: []
    };

    const seasonMap = new Map(
      current.seasons.map((season) => [
        season.seasonNumber == null ? "?" : String(season.seasonNumber).padStart(2, "0"),
        {
          seasonNumber: season.seasonNumber,
          episodes: [...season.episodes],
          explicitIncomplete: Boolean(season.explicitIncomplete)
        }
      ])
    );

    const archivedSeasonLabels = [];

    for (const archivedSeason of ensureArray(archivedSeries.seasons)) {
      const seasonNumber = archivedSeason.seasonNumber ?? null;
      const seasonKey = seasonNumber == null ? "?" : String(seasonNumber).padStart(2, "0");
      const mergedEpisodes = new Set([
        ...(seasonMap.get(seasonKey)?.episodes ?? []),
        ...ensureArray(archivedSeason.availableEpisodes ?? archivedSeason.episodes).map(Number)
      ]);

      seasonMap.set(seasonKey, {
        seasonNumber,
        episodes: [...mergedEpisodes].filter(Number.isFinite).sort((left, right) => left - right),
        explicitIncomplete: Boolean(seasonMap.get(seasonKey)?.explicitIncomplete)
      });

      archivedSeasonLabels.push(
        seasonNumber == null ? "stagione ?" : `S${String(seasonNumber).padStart(2, "0")}`
      );
    }

    seriesMap.set(seriesKey, {
      ...current,
      seasons: sortSeasons([...seasonMap.values()])
    });

    if (archivedSeasonLabels.length) {
      offlineSources.push(
        `inventario offline salvato: ${archivedSeries.title} (${archivedSeasonLabels.join(", ")})`
      );
    }
  }

  return {
    ...scan,
    series: [...seriesMap.values()].sort((left, right) => left.title.localeCompare(right.title, "it")),
    offlineSources: [...new Set(offlineSources)]
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(`Fetch fallita: ${response.status} ${url}`);
  }

  return response.json();
}

function scoreWikipediaResult(result, title, kind, year) {
  const titleScore = normalizeForCompare(result.title) === normalizeForCompare(title)
    ? 70
    : normalizeForCompare(result.title).includes(normalizeForCompare(title))
      ? 45
      : 10;

  const description = normalizeForCompare(result.description);
  const kindScore = kind === "movie"
    ? (description.includes("film") ? 25 : 0)
    : (description.includes("television") || description.includes("tv") || description.includes("anime") ? 25 : 0);

  const penalty = description.includes("same term") || description.includes("topics referred")
    ? -60
    : 0;
  const yearScore = year && result.description && result.description.includes(String(year)) ? 15 : 0;
  return titleScore + kindScore + yearScore + penalty;
}

async function findWikipediaPoster({ title, kind, year, queries }) {
  const languageHosts = ["en.wikipedia.org", "it.wikipedia.org"];
  const directKeys = [];

  for (const query of queries) {
    const baseTitle = query.replace(/\((\d{4})\)/g, "").replace(/\bfilm\b/gi, "").trim();
    const pageBase = baseTitle.replace(/\s+/g, "_");
    if (kind === "movie" && year) {
      directKeys.push(`${pageBase}_(${year}_film)`);
    }
    if (kind === "movie") {
      directKeys.push(`${pageBase}_(film)`);
    }
    if (kind === "series") {
      directKeys.push(`${pageBase}_(TV_series)`, `${pageBase}_(television_series)`);
    }
  }

  for (const key of [...new Set(directKeys)]) {
    for (const host of languageHosts) {
      try {
        const summaryUrl = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(key)}`;
        const summary = await fetchJson(summaryUrl);
        const imageUrl = summary.originalimage?.source || summary.thumbnail?.source || null;
        if (summary.type === "standard" && imageUrl) {
          return {
            posterUrl: imageUrl,
            sourceUrl: `https://${host}/wiki/${encodeURIComponent(key)}`,
            matchedTitle: summary.title || title,
            source: host.includes("it.") ? "Wikipedia IT" : "Wikipedia EN"
          };
        }
      } catch {
        await delay(60);
      }
    }
  }

  for (const query of queries) {
    for (const host of languageHosts) {
      try {
        const searchUrl = `https://${host}/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=5`;
        const searchPayload = await fetchJson(searchUrl);
        const results = (searchPayload.pages ?? [])
          .map((page) => ({
            ...page,
            score: scoreWikipediaResult(page, title, kind, year)
          }))
          .sort((left, right) => right.score - left.score);

        const candidates = results.filter((result) => result.score >= 15).slice(0, 5);
        if (!candidates.length) {
          continue;
        }

        for (const candidate of candidates) {
          const summaryUrl = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(candidate.key)}`;
          const summary = await fetchJson(summaryUrl);
          const imageUrl = summary.originalimage?.source || summary.thumbnail?.source || null;
          if (!imageUrl) {
            continue;
          }

          return {
            posterUrl: imageUrl,
            sourceUrl: `https://${host}/wiki/${encodeURIComponent(candidate.key)}`,
            matchedTitle: summary.title || candidate.title,
            source: host.includes("it.") ? "Wikipedia IT" : "Wikipedia EN"
          };
        };
      } catch {
        await delay(100);
      }
    }
  }

  return null;
}

function scoreImdbResult(result, title, year) {
  const normalizedResult = normalizeForCompare(result.l);
  const normalizedTitle = normalizeForCompare(title);
  const titleScore = normalizedResult === normalizedTitle
    ? 70
    : normalizedResult.includes(normalizedTitle) || normalizedTitle.includes(normalizedResult)
      ? 45
      : 10;
  const kindScore = result.qid === "movie" || result.q === "feature" ? 25 : 0;
  const yearScore = year && Number(result.y) === Number(year) ? 15 : 0;
  return titleScore + kindScore + yearScore;
}

async function findImdbPoster({ title, year, queries }) {
  for (const query of queries) {
    const normalizedQuery = normalizeForCompare(query);
    const firstChar = normalizedQuery[0];
    if (!firstChar) {
      continue;
    }

    try {
      const url = `https://v2.sg.media-imdb.com/suggestion/${encodeURIComponent(firstChar)}/${encodeURIComponent(normalizedQuery)}.json`;
      const payload = await fetchJson(url);
      const candidates = ensureArray(payload.d)
        .filter((result) => result?.i?.imageUrl)
        .map((result) => ({
          ...result,
          score: scoreImdbResult(result, title, year)
        }))
        .sort((left, right) => right.score - left.score);

      const best = candidates[0];
      if (!best || best.score < 25) {
        continue;
      }

      return {
        posterUrl: best.i.imageUrl,
        sourceUrl: best.id ? `https://www.imdb.com/title/${best.id}/` : null,
        matchedTitle: best.l || title,
        source: "IMDb"
      };
    } catch {
      await delay(80);
    }
  }

  return null;
}

function scoreTvMazeResult(result, title) {
  const normalizedShow = normalizeForCompare(result.show?.name);
  const normalizedTitle = normalizeForCompare(title);
  if (normalizedShow === normalizedTitle) {
    return 100;
  }
  if (normalizedShow.includes(normalizedTitle) || normalizedTitle.includes(normalizedShow)) {
    return 65;
  }
  return 10;
}

async function findTvMetadata(series) {
  const queries = buildSeriesSearchQueries(series);

  for (const query of queries) {
    try {
      const results = await fetchJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
      const best = [...results]
        .sort((left, right) => scoreTvMazeResult(right, query) - scoreTvMazeResult(left, query))[0];

      if (!best?.show?.id) {
        continue;
      }

      const payload = await fetchJson(`https://api.tvmaze.com/shows/${best.show.id}?embed=episodes`);
      const seasonEpisodeTotals = {};
      for (const episode of payload._embedded?.episodes ?? []) {
        const seasonNumber = episode.season;
        seasonEpisodeTotals[seasonNumber] = (seasonEpisodeTotals[seasonNumber] ?? 0) + 1;
      }

      return {
        posterUrl: payload.image?.original || payload.image?.medium || null,
        sourceUrl: payload.officialSite || payload.url || null,
        matchedTitle: payload.name || series.title,
        source: "TVMaze",
        seasonEpisodeTotals
      };
    } catch {
      await delay(120);
    }
  }

  return null;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function enrichMovies(movies, cache) {
  const updatedCache = { ...cache.movies };

  const enriched = await mapLimit(movies, 6, async (movie, index) => {
    console.log(`Poster film ${index + 1}/${movies.length}: ${movie.title}`);
    const cached = updatedCache[movie.key];
    if (cached?.posterUrl) {
      return { ...movie, ...cached };
    }

    const wikipediaResult = await findWikipediaPoster({
      title: movie.title,
      kind: "movie",
      year: extractYear(movie.title),
      queries: buildMovieSearchQueries(movie)
    });
    const result = wikipediaResult ?? await findImdbPoster({
      title: movie.title,
      year: extractYear(movie.title),
      queries: buildMovieSearchQueries(movie)
    });

    updatedCache[movie.key] = {
      posterUrl: result?.posterUrl ?? null,
      posterSourceUrl: result?.sourceUrl ?? null,
      posterSourceName: result?.source ?? null,
      posterMatchedTitle: result?.matchedTitle ?? null
    };

    return { ...movie, ...updatedCache[movie.key] };
  });

  return { items: enriched, cache: updatedCache };
}

function evaluateSeasonStatus(season, expectedTotal) {
  const episodes = season.episodes;
  const contiguous = episodes.every((episode, index) => index === 0 || episode === episodes[index - 1] + 1);
  const startsAtOne = episodes[0] === 1;

  if (expectedTotal != null) {
    const complete = startsAtOne && contiguous && episodes.length === expectedTotal;
    return {
      status: complete ? "completa" : "incompleta",
      label: `${episodes.length}/${expectedTotal} episodi`
    };
  }

  if (season.explicitIncomplete || !startsAtOne || !contiguous) {
    return {
      status: "incompleta",
      label: `${episodes.length} episodi rilevati`
    };
  }

  return {
    status: "non verificata",
    label: `${episodes.length} episodi rilevati`
  };
}

async function enrichSeries(seriesList, cache) {
  const updatedCache = { ...cache.series };

  const enriched = await mapLimit(seriesList, 4, async (series, index) => {
    console.log(`Poster/metadata serie ${index + 1}/${seriesList.length}: ${series.title}`);
    const cached = updatedCache[series.key] ?? {};
    let merged = cached;

    if (!cached.posterUrl || !cached.seasonEpisodeTotals) {
      const tvMeta = await findTvMetadata(series);
      const wikipediaFallback = !tvMeta?.posterUrl
        ? await findWikipediaPoster({
            title: series.title,
            kind: "series",
            year: null,
            queries: buildSeriesSearchQueries(series)
          })
        : null;

      merged = {
        posterUrl: tvMeta?.posterUrl || wikipediaFallback?.posterUrl || null,
        posterSourceUrl: tvMeta?.sourceUrl || wikipediaFallback?.sourceUrl || null,
        posterSourceName: tvMeta?.source || wikipediaFallback?.source || null,
        posterMatchedTitle: tvMeta?.matchedTitle || wikipediaFallback?.matchedTitle || null,
        seasonEpisodeTotals: tvMeta?.seasonEpisodeTotals || cached.seasonEpisodeTotals || {}
      };
      updatedCache[series.key] = merged;
    }

    return {
      ...series,
      ...merged,
      seasons: series.seasons.map((season) => {
        const expectedTotal = season.seasonNumber == null ? null : merged.seasonEpisodeTotals?.[season.seasonNumber] ?? null;
        const status = evaluateSeasonStatus(season, expectedTotal);
        return {
          seasonNumber: season.seasonNumber,
          availableEpisodes: season.episodes,
          availableLabel: createRangeLabel(season.episodes),
          expectedEpisodes: expectedTotal,
          ...status
        };
      })
    };
  });

  return { items: enriched, cache: updatedCache };
}

function buildMovieMarkdownLine(movie) {
  const suffixes = [];
  if (movie.tags.length) {
    suffixes.push(movie.tags.join(", "));
  }
  if (movie.notes.length) {
    suffixes.push(movie.notes.join(", "));
  }

  if (!suffixes.length) {
    return `- ${movie.title}`;
  }

  return `- ${movie.title} [${suffixes.join(" | ")}]`;
}

function buildSeriesMarkdownLine(series) {
  const seasons = series.seasons.map((season) => {
    const seasonLabel = season.seasonNumber == null
      ? "stagione ?"
      : `S${String(season.seasonNumber).padStart(2, "0")}`;
    return `${seasonLabel}: ${season.availableLabel} (${season.label}, ${season.status})`;
  });

  return `- ${series.title}: ${seasons.join("; ")}`;
}

function generateMarkdownLegacy(catalog) {
  const generatedAt = new Date(catalog.generatedAt).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "medium"
  });

  return [
    "# Catalogo media locale",
    "",
    `Generato il ${generatedAt}.`,
    "",
    `Sorgenti scansite: ${formatRootList(catalog.sourceRoots)}`,
    ...(catalog.offlineSources?.length
      ? ["", `Inventari offline inclusi: ${formatRootList(catalog.offlineSources)}`]
      : []),
    "",
    `Totale film/standalone: ${catalog.summary.movieCount}`,
    `Totale serie TV: ${catalog.summary.seriesCount}`,
    "",
    "Note di classificazione:",
    "- Ho considerato come film anche documentari, speciali, concerti e contenuti standalone non episodici.",
    "- Ho ignorato sample, cartelle sottotitoli/subs, featurette, deleted scenes ed extra.",
    "- I contenuti in `[2categorize]` restano visibili come elementi da ordinare.",
    "- Ho escluso i video personali, i corsi e i file software presenti su `D:` e `E:` perché non sono film o serie TV.",
    "",
    "## Film",
    "",
    ...catalog.movies.map(buildMovieMarkdownLine),
    "",
    "## Serie TV",
    "",
    ...catalog.series.map(buildSeriesMarkdownLine),
    ""
  ].join("\n");
}

function generateMarkdown(catalog) {
  const generatedAt = new Date(catalog.generatedAt).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "medium"
  });

  return [
    "# Catalogo media locale",
    "",
    `Generato il ${generatedAt}.`,
    "",
    `Sorgenti scansite: ${formatRootList(catalog.sourceRoots)}`,
    ...(catalog.offlineSources?.length
      ? ["", `Inventari offline inclusi: ${formatRootList(catalog.offlineSources)}`]
      : []),
    "",
    `Totale film/standalone: ${catalog.summary.movieCount}`,
    `Totale serie TV: ${catalog.summary.seriesCount}`,
    "",
    "Note di classificazione:",
    "- Ho considerato come film anche documentari, speciali, concerti e contenuti standalone non episodici.",
    "- Ho ignorato sample, cartelle sottotitoli/subs, featurette, deleted scenes ed extra.",
    "- I contenuti in `[2categorize]` restano visibili come elementi da ordinare.",
    "- Le stagioni possono risultare incomplete se gli episodi locali non coprono l'intero totale noto della serie.",
    "",
    "## Film",
    "",
    ...catalog.movies.map(buildMovieMarkdownLine),
    "",
    "## Serie TV",
    "",
    ...catalog.series.map(buildSeriesMarkdownLine),
    ""
  ].join("\n");
}

async function main() {
  await ensureDataDirectory();
  const liveScan = await scanLibrary();
  const scan = await mergeArchivedInventory(liveScan);
  const cache = await readJsonIfExists(CACHE_PATH, { movies: {}, series: {} });

  const enrichedMovies = await enrichMovies(scan.movies, cache);
  const enrichedSeries = await enrichSeries(scan.series, cache);

  const catalog = {
    generatedAt: new Date().toISOString(),
    sourceRoots: scan.sourceRoots,
    offlineSources: scan.offlineSources,
    summary: {
      movieCount: enrichedMovies.items.length,
      seriesCount: enrichedSeries.items.length
    },
    notes: [
      `Film e serie catalogati dalla libreria locale rilevata in ${scan.sourceRoots.length ? scan.sourceRoots.join(", ") : "nessuna sorgente disponibile"}.`,
      ...(scan.offlineSources?.length
        ? [`Inventari offline inclusi: ${scan.offlineSources.join(", ")}.`]
        : []),
      "Poster recuperati online da Wikipedia e TVMaze quando disponibili.",
      "Stagioni segnate come incomplete confrontando gli episodi presenti con i metadati delle serie, oppure tramite evidenze locali."
    ],
    movies: enrichedMovies.items.map((movie) => ({
      ...movie,
      tags: [...movie.tags].sort(),
      notes: [...movie.notes].sort()
    })),
    series: enrichedSeries.items
  };

  await writeJson(CATALOG_JSON_PATH, catalog);
  await writeJson(CACHE_PATH, {
    movies: enrichedMovies.cache,
    series: enrichedSeries.cache
  });
  await fs.writeFile(MARKDOWN_PATH, generateMarkdown(catalog), "utf8");

  console.log(`Catalogo JSON scritto in ${CATALOG_JSON_PATH}`);
  console.log(`Catalogo Markdown scritto in ${MARKDOWN_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
