const NASA_PROXY_BASE = "/api/nasa";
const HISTORY_KEY = "orbitWatchAsteroidHistory";

const state = {
  asteroids: [],
  currentTitle: "Ready to scan",
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  setDefaultDates();
  loadStoredData();
  bindEvents();
});

function cacheElements() {
  elements.dateForm = document.getElementById("date-form");
  elements.idForm = document.getElementById("id-form");
  elements.startDate = document.getElementById("start-date");
  elements.endDate = document.getElementById("end-date");
  elements.asteroidId = document.getElementById("asteroid-id");
  elements.todayButton = document.getElementById("today-button");
  elements.clearHistory = document.getElementById("clear-history");
  elements.error = document.getElementById("error-container");
  elements.loading = document.getElementById("loading-container");
  elements.empty = document.getElementById("empty-state");
  elements.neoContainer = document.getElementById("neo-container");
  elements.details = document.getElementById("asteroid-details");
  elements.resultsTitle = document.getElementById("results-title");
  elements.statusPill = document.getElementById("status-pill");
  elements.metricTotal = document.getElementById("metric-total");
  elements.metricHazardous = document.getElementById("metric-hazardous");
  elements.metricClosest = document.getElementById("metric-closest");
  elements.metricFastest = document.getElementById("metric-fastest");
  elements.heroTotal = document.getElementById("hero-total");
  elements.heroHazardous = document.getElementById("hero-hazardous");
}

function bindEvents() {
  elements.dateForm.addEventListener("submit", handleDateSearch);
  elements.idForm.addEventListener("submit", handleIdSearch);
  elements.todayButton.addEventListener("click", loadToday);
  elements.clearHistory.addEventListener("click", clearHistory);

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => setDateRange(button.dataset.range));
  });
}

function setDefaultDates() {
  const today = new Date();
  elements.startDate.value = formatDate(today);
  elements.endDate.value = formatDate(today);
}

function setDateRange(range) {
  const start = new Date();
  const end = new Date();

  if (range === "week") {
    end.setDate(start.getDate() + 7);
  }

  elements.startDate.value = formatDate(start);
  elements.endDate.value = formatDate(end);
}

function loadToday() {
  setDateRange("today");
  elements.dateForm.requestSubmit();
}

async function handleDateSearch(event) {
  event.preventDefault();

  const startDate = elements.startDate.value;
  const endDate = elements.endDate.value;

  if (!isDateRangeValid(startDate, endDate)) {
    showError("Choose a date range between 1 and 7 days. The end date cannot be before the start date.");
    return;
  }

  const url = `${NASA_PROXY_BASE}?type=feed&start_date=${encodeURIComponent(
        startDate
    )}&end_date=${encodeURIComponent(endDate)}`;

  try {
    setLoading(true, "Scanning date range");
    clearError();

    const data = await fetchJson(url);
    const asteroids = Object.values(data.near_earth_objects || {}).flat();

    state.asteroids = sortAsteroidsByDate(asteroids);
    state.currentTitle = `${formatReadableDate(startDate)} → ${formatReadableDate(endDate)}`;

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({
        title: state.currentTitle,
        asteroids: state.asteroids,
      })
    );

    renderAsteroidList(state.asteroids, state.currentTitle);
  } catch (error) {
    showError(`NASA request failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function handleIdSearch(event) {
  event.preventDefault();

  const asteroidId = elements.asteroidId.value.trim();

  if (!asteroidId) {
    showError("Enter an asteroid ID first.");
    return;
  }

  try {
    setLoading(true, "Looking up asteroid");
    clearError();

    const neo = await fetchAsteroidById(asteroidId);
    renderAsteroidDetails(neo);
    updateTitle(`Asteroid ID ${asteroidId}`);
    updateStatus("Single object");
  } catch (error) {
    showError(`Could not find that asteroid: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function fetchAsteroidById(asteroidId) {
  const url = `${NASA_PROXY_BASE}?type=neo&id=${encodeURIComponent(
    asteroidId
  )}`;

  return fetchJson(url);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const data = await response.json();
      message = data.error?.message || data.msg || message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return response.json();
}

function renderAsteroidList(asteroids, title) {
  elements.details.style.display = "none";
  elements.details.innerHTML = "";
  elements.neoContainer.innerHTML = "";
  elements.neoContainer.style.display = "grid";
  elements.empty.style.display = asteroids.length ? "none" : "grid";

  updateTitle(title);
  updateStatus(`${asteroids.length} loaded`);
  updateMetrics(asteroids);

  asteroids.forEach((neo, index) => {
    const approach = getPrimaryApproach(neo);
    const isHazardous = neo.is_potentially_hazardous_asteroid;

    const row = document.createElement("article");
    row.className = `neo-row ${isHazardous ? "neo-row-alert" : ""}`;

    row.innerHTML = `
      <div class="object-main">
        <span class="object-index">${String(index + 1).padStart(2, "0")}</span>

        <div>
          <h3>${escapeHtml(neo.name)}</h3>
          <p class="neo-id">NASA object ID ${escapeHtml(neo.id)}</p>
        </div>
      </div>

      <div class="object-data">
        <div>
          <span>Diameter</span>
          <strong>${formatDiameter(neo)}</strong>
        </div>

        <div>
          <span>Approach</span>
          <strong>${approach ? formatReadableDate(approach.close_approach_date) : "—"}</strong>
        </div>

        <div>
          <span>Miss distance</span>
          <strong>${approach ? formatNumber(approach.miss_distance.kilometers, 0) + " km" : "—"}</strong>
        </div>

        <div>
          <span>Velocity</span>
          <strong>${approach ? formatNumber(approach.relative_velocity.kilometers_per_hour, 0) + " km/h" : "—"}</strong>
        </div>
      </div>

      <div class="object-status">
        <span class="badge ${isHazardous ? "badge-hazard" : "badge-safe"}">
          ${isHazardous ? "Hazard" : "Clear"}
        </span>

        <button type="button" class="details-button">Details</button>
      </div>
    `;

    row.querySelector(".details-button").addEventListener("click", async () => {
      try {
        setLoading(true, "Loading details");
        const detailedNeo = await fetchAsteroidById(neo.id);
        renderAsteroidDetails(detailedNeo);
      } catch (error) {
        showError(`Could not load asteroid details: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });

    elements.neoContainer.appendChild(row);
  });
}

function renderAsteroidDetails(neo) {
  elements.neoContainer.style.display = "none";
  elements.empty.style.display = "none";
  elements.details.style.display = "block";

  updateMetrics([neo]);

  const approaches = (neo.close_approach_data || []).slice(0, 8);

  elements.details.innerHTML = `
    <div class="details-header">
      <div>
        <p class="eyebrow">Asteroid profile</p>
        <h2>${escapeHtml(neo.name)}</h2>
        <p>ID ${escapeHtml(neo.id)} · NASA JPL Small-Body Database link available from API data.</p>
      </div>
      <span class="badge ${neo.is_potentially_hazardous_asteroid ? "badge-hazard" : "badge-safe"}">
        ${neo.is_potentially_hazardous_asteroid ? "Potentially hazardous" : "Not hazardous"}
      </span>
    </div>

    <div class="details-grid">
      <div class="detail-tile">
        <span>Absolute magnitude</span>
        <strong>${escapeHtml(neo.absolute_magnitude_h)}</strong>
      </div>
      <div class="detail-tile">
        <span>Estimated diameter</span>
        <strong>${formatDiameter(neo)}</strong>
      </div>
      <div class="detail-tile">
        <span>Orbiting body</span>
        <strong>${escapeHtml(getPrimaryApproach(neo)?.orbiting_body || "Earth")}</strong>
      </div>
      <div class="detail-tile">
        <span>First observed</span>
        <strong>${escapeHtml(neo.orbital_data?.first_observation_date || "—")}</strong>
      </div>
      <div class="detail-tile">
        <span>Last observed</span>
        <strong>${escapeHtml(neo.orbital_data?.last_observation_date || "—")}</strong>
      </div>
      <div class="detail-tile">
        <span>Orbital period</span>
        <strong>${neo.orbital_data?.orbital_period ? formatNumber(neo.orbital_data.orbital_period, 1) + " days" : "—"}</strong>
      </div>
    </div>

    <h3>Close approach data</h3>
    <ul class="approach-list">
      ${approaches.length ? approaches.map((approach) => `
        <li>
          <strong>${escapeHtml(approach.close_approach_date)}</strong>
          <span>Miss distance: ${formatNumber(approach.miss_distance.kilometers, 0)} km</span>
          <span>Velocity: ${formatNumber(approach.relative_velocity.kilometers_per_hour, 0)} km/h</span>
        </li>
      `).join("") : "<li>No close approach data available.</li>"}
    </ul>

    <button type="button" class="back-button" id="back-to-results">
      Back to results
    </button>
  `;

  document.getElementById("back-to-results").addEventListener("click", () => {
    if (state.asteroids.length) {
      renderAsteroidList(state.asteroids, state.currentTitle);
    } else {
      elements.details.style.display = "none";
      elements.empty.style.display = "grid";
      updateMetrics([]);
    }
  });
}

function updateMetrics(asteroids) {
  const total = asteroids.length;
  const hazardous = asteroids.filter((neo) => neo.is_potentially_hazardous_asteroid).length;
  const approaches = asteroids.map(getPrimaryApproach).filter(Boolean);

  const closest = approaches.reduce((min, approach) => {
    const distance = Number(approach.miss_distance.kilometers);
    return distance < min ? distance : min;
  }, Infinity);

  const fastest = approaches.reduce((max, approach) => {
    const velocity = Number(approach.relative_velocity.kilometers_per_hour);
    return velocity > max ? velocity : max;
  }, 0);

  elements.metricTotal.textContent = total || "—";
  elements.metricHazardous.textContent = total ? hazardous : "—";
  elements.metricClosest.textContent = Number.isFinite(closest) ? `${formatNumber(closest, 0)} km` : "—";
  elements.metricFastest.textContent = fastest ? `${formatNumber(fastest, 0)} km/h` : "—";
  elements.heroTotal.textContent = total;
  elements.heroHazardous.textContent = hazardous;
}

function getPrimaryApproach(neo) {
  return neo.close_approach_data?.[0] || null;
}

function sortAsteroidsByDate(asteroids) {
  return [...asteroids].sort((a, b) => {
    const approachA = getPrimaryApproach(a)?.close_approach_date || "9999-12-31";
    const approachB = getPrimaryApproach(b)?.close_approach_date || "9999-12-31";
    return approachA.localeCompare(approachB);
  });
}

function isDateRangeValid(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diffInDays = (end - start) / (1000 * 60 * 60 * 24);
  return diffInDays >= 0 && diffInDays <= 7;
}

function loadStoredData() {
  const stored = localStorage.getItem(HISTORY_KEY);

  if (!stored) {
    updateMetrics([]);
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    state.asteroids = parsed.asteroids || [];
    state.currentTitle = parsed.title || "Saved asteroid results";
    renderAsteroidList(state.asteroids, state.currentTitle);
  } catch {
    localStorage.removeItem(HISTORY_KEY);
    updateMetrics([]);
  }
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  state.asteroids = [];
  state.currentTitle = "Ready to scan";
  elements.neoContainer.innerHTML = "";
  elements.neoContainer.style.display = "none";
  elements.details.style.display = "none";
  elements.empty.style.display = "grid";
  updateTitle("Ready to scan");
  updateStatus("Idle");
  updateMetrics([]);
  clearError();
}

function setLoading(isLoading, label = "Loading") {
  elements.loading.style.display = isLoading ? "block" : "none";
  elements.statusPill.textContent = isLoading ? label : "Ready";
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.style.display = "block";
}

function clearError() {
  elements.error.textContent = "";
  elements.error.style.display = "none";
}

function updateTitle(title) {
  elements.resultsTitle.textContent = title;
}

function updateStatus(status) {
  elements.statusPill.textContent = status;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatReadableDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value, decimals = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: decimals,
  }).format(number);
}

function formatDiameter(neo) {
  const min = neo.estimated_diameter?.meters?.estimated_diameter_min;
  const max = neo.estimated_diameter?.meters?.estimated_diameter_max;

  if (!Number.isFinite(Number(min)) || !Number.isFinite(Number(max))) {
    return "—";
  }

  return `${formatNumber(min, 1)}–${formatNumber(max, 1)} m`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
