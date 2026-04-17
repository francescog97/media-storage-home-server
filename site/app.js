const state = {
  catalog: null,
  query: "",
  view: "all"
};

const elements = {
  emptyState: document.querySelector("#emptyState"),
  generatedAt: document.querySelector("#generatedAt"),
  movieCount: document.querySelector("#movieCount"),
  movieGrid: document.querySelector("#movieGrid"),
  movieMeta: document.querySelector("#movieMeta"),
  movieSection: document.querySelector("#film"),
  searchInput: document.querySelector("#searchInput"),
  seriesCount: document.querySelector("#seriesCount"),
  seriesGrid: document.querySelector("#seriesGrid"),
  seriesMeta: document.querySelector("#seriesMeta"),
  seriesSection: document.querySelector("#serie"),
  sourceRoots: document.querySelector("#sourceRoots"),
  viewButtons: [...document.querySelectorAll("[data-view]")]
};

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(value) {
  if (!value) {
    return "n/d";
  }
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSourceSummary(catalog) {
  const roots = Array.isArray(catalog?.sourceRoots) ? catalog.sourceRoots : [];
  const offlineSources = Array.isArray(catalog?.offlineSources) ? catalog.offlineSources : [];

  if (!roots.length && !offlineSources.length) {
    return "Sorgente catalogo non disponibile";
  }

  if (roots.length && offlineSources.length) {
    return `Sorgenti scansite: ${roots.join(", ")} | Inventari offline: ${offlineSources.join(", ")}`;
  }

  if (roots.length) {
    return `Sorgenti scansite: ${roots.join(", ")}`;
  }

  return `Inventari offline: ${offlineSources.join(", ")}`;
}

function posterMarkup(item) {
  const fallback = `<div class="poster-fallback">${escapeHtml(item.title)}</div>`;
  const badge = item.tags?.[0]
    ? `<span class="poster-badge">${escapeHtml(item.tags[0])}</span>`
    : "";

  if (!item.posterUrl) {
    return `<div class="poster-frame">${badge}${fallback}</div>`;
  }

  return `
    <div class="poster-frame">
      ${badge}
      <img
        src="${escapeHtml(item.posterUrl)}"
        alt="Locandina di ${escapeHtml(item.title)}"
        loading="lazy"
        referrerpolicy="no-referrer"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      >
      ${fallback.replace('class="poster-fallback"', 'class="poster-fallback" style="display:none"')}
    </div>
  `;
}

function movieCard(movie) {
  const tagMarkup = [...(movie.tags ?? []), ...(movie.notes ?? [])]
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  const sourceLink = movie.posterSourceUrl
    ? `<a class="source-link" href="${escapeHtml(movie.posterSourceUrl)}" target="_blank" rel="noreferrer">Fonte locandina</a>`
    : "";

  return `
    <article class="card">
      ${posterMarkup(movie)}
      <div class="card-body">
        <h3>${escapeHtml(movie.title)}</h3>
        ${tagMarkup ? `<div class="tag-row">${tagMarkup}</div>` : ""}
        ${sourceLink}
      </div>
    </article>
  `;
}

function seasonPill(season) {
  const statusClass = season.status.replace(/\s+/g, "-");
  const seasonTitle = season.seasonNumber == null
    ? "Stagione ?"
    : `S${String(season.seasonNumber).padStart(2, "0")}`;

  return `
    <span class="season-pill ${escapeHtml(statusClass)}">
      <strong>${escapeHtml(seasonTitle)}</strong>
      <span>${escapeHtml(season.availableLabel)}</span>
      <span>${escapeHtml(season.label)}</span>
      <span>${escapeHtml(season.status)}</span>
    </span>
  `;
}

function seriesCard(series) {
  const sourceLink = series.posterSourceUrl
    ? `<a class="source-link" href="${escapeHtml(series.posterSourceUrl)}" target="_blank" rel="noreferrer">Fonte locandina</a>`
    : "";

  return `
    <article class="card">
      ${posterMarkup(series)}
      <div class="card-body">
        <h3>${escapeHtml(series.title)}</h3>
        <p>${series.seasons.length} ${series.seasons.length === 1 ? "stagione disponibile" : "stagioni disponibili"}</p>
        <div class="season-list">
          ${series.seasons.map(seasonPill).join("")}
        </div>
        ${sourceLink}
      </div>
    </article>
  `;
}

function matchesMovie(movie, query) {
  if (!query) {
    return true;
  }

  const haystack = normalize([
    movie.title,
    ...(movie.tags ?? []),
    ...(movie.notes ?? [])
  ].join(" "));

  return haystack.includes(query);
}

function matchesSeries(series, query) {
  if (!query) {
    return true;
  }

  const haystack = normalize([
    series.title,
    ...series.seasons.map((season) => [
      season.seasonNumber == null ? "stagione sconosciuta" : `stagione ${season.seasonNumber}`,
      season.availableLabel,
      season.status,
      season.label
    ].join(" "))
  ].join(" "));

  return haystack.includes(query);
}

function render() {
  if (!state.catalog) {
    return;
  }

  const normalizedQuery = normalize(state.query);
  const movies = state.catalog.movies.filter((movie) => matchesMovie(movie, normalizedQuery));
  const series = state.catalog.series.filter((entry) => matchesSeries(entry, normalizedQuery));

  elements.movieCount.textContent = state.catalog.summary.movieCount;
  elements.seriesCount.textContent = state.catalog.summary.seriesCount;
  elements.generatedAt.textContent = formatDate(state.catalog.generatedAt);
  elements.sourceRoots.textContent = formatSourceSummary(state.catalog);
  elements.movieMeta.textContent = `${movies.length} risultati visibili`;
  elements.seriesMeta.textContent = `${series.length} risultati visibili`;

  elements.movieGrid.innerHTML = movies.map(movieCard).join("");
  elements.seriesGrid.innerHTML = series.map(seriesCard).join("");

  const showMovies = state.view === "all" || state.view === "movies";
  const showSeries = state.view === "all" || state.view === "series";

  elements.movieSection.classList.toggle("is-hidden", !showMovies);
  elements.seriesSection.classList.toggle("is-hidden", !showSeries);

  const isEmpty = (showMovies ? movies.length === 0 : true) && (showSeries ? series.length === 0 : true);
  elements.emptyState.classList.toggle("is-hidden", !isEmpty);
}

async function bootstrap() {
  const response = await fetch("./data/catalog.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossibile caricare il catalogo JSON.");
  }

  state.catalog = await response.json();
  render();
}

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

elements.viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    elements.viewButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

bootstrap().catch((error) => {
  elements.emptyState.classList.remove("is-hidden");
  elements.emptyState.innerHTML = `
    <h3>Errore caricando il catalogo</h3>
    <p>${escapeHtml(error.message)}</p>
  `;
});
