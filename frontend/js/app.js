/* Swachh Bharat Monitor — frontend app */

const API = "/api/v1";

const App = (() => {
  // ── State ──────────────────────────────────────────────────
  let allCities = [];
  let map = null;
  let dotLayer = null;
  let heatLayer = null;
  let mapMode = "dots";
  let selectedFile = null;
  let rankFilter = "all";

  // ── Boot ──────────────────────────────────────────────────
  async function init() {
    setupTabs();
    setupDropzone();
    setupRankFilters();
    setupRankSearch();
    await loadCities();
    initMap();
  }

  // ── Tabs ───────────────────────────────────────────────────
  function setupTabs() {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.tab;
        document.querySelectorAll(".tab").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll(".tab-content").forEach((s) => s.classList.add("hidden"));
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        document.getElementById("tab-" + id).classList.remove("hidden");
        if (id === "rankings") renderRankings();
        if (id === "heatmap" && map) setTimeout(() => map.invalidateSize(), 50);
      });
    });
  }

  // ── Load cities from API ───────────────────────────────────
  async function loadCities() {
    try {
      const res = await fetch(`${API}/cities`);
      const data = await res.json();
      allCities = data.cities;
      updateKPIs();
      populateCitySelect();
    } catch (e) {
      console.error("Failed to load cities", e);
    }
  }

  function updateKPIs() {
    const total = allCities.reduce((s, c) => s + c.reportCount, 0);
    const cleanest = allCities.reduce((a, b) => (b.score > a.score ? b : a), allCities[0]);
    document.getElementById("kpi-cities").textContent = allCities.length.toLocaleString();
    document.getElementById("kpi-total").textContent = total.toLocaleString();
    document.getElementById("kpi-today").textContent = Math.floor(total * 0.014); // demo: ~1.4% today
    document.getElementById("kpi-cleanest").textContent = cleanest ? cleanest.name : "—";
    document.getElementById("h-total-reports").textContent = total.toLocaleString();
    document.getElementById("h-cities-count").textContent = allCities.length.toLocaleString();
  }

  function populateCitySelect() {
    const sel = document.getElementById("f-city");
    const sorted = [...allCities].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.state})`;
      sel.appendChild(opt);
    });
  }

  // ── Map ────────────────────────────────────────────────────
  function initMap() {
    map = L.map("map", { zoomControl: true, scrollWheelZoom: true }).setView([22.5, 80.5], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    buildDotLayer();
    buildHeatLayer();
    setMapMode("dots");
  }

  function scoreToColor(score) {
    if (score >= 80) return "#1a9641";
    if (score >= 60) return "#a6d96a";
    if (score >= 40) return "#ffffbf";
    if (score >= 20) return "#fdae61";
    return "#d7191c";
  }

  function buildDotLayer() {
    if (dotLayer) dotLayer.remove();
    const group = L.layerGroup();
    allCities.forEach((c) => {
      const color = scoreToColor(c.score);
      const radius = c.metro ? 10 : 7;
      const circle = L.circleMarker([c.lat, c.lng], {
        radius,
        fillColor: color,
        color: "#fff",
        weight: 1.5,
        fillOpacity: 0.88,
      });
      circle.bindPopup(`
        <div class="popup-city">${c.name}</div>
        <div class="popup-state">${c.state}</div>
        <div class="popup-score" style="color:${color}">Score: ${c.score}/100</div>
        <div class="popup-reports">${c.reportCount} garbage reports</div>
      `);
      group.addLayer(circle);
    });
    dotLayer = group;
  }

  function buildHeatLayer() {
    if (!window.L || !L.heatLayer) return;
    const points = allCities
      .filter((c) => c.reportCount > 0)
      .map((c) => [c.lat, c.lng, Math.min(1, c.reportCount / 15)]);
    heatLayer = L.heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 9,
      gradient: { 0.0: "#1a9641", 0.4: "#a6d96a", 0.6: "#fdae61", 1.0: "#d7191c" },
    });
  }

  function setMapMode(mode) {
    mapMode = mode;
    document.getElementById("btn-dots").classList.toggle("active", mode === "dots");
    document.getElementById("btn-heat").classList.toggle("active", mode === "heat");
    if (mode === "dots") {
      if (heatLayer) heatLayer.remove();
      if (dotLayer) dotLayer.addTo(map);
    } else {
      if (dotLayer) dotLayer.remove();
      if (heatLayer) heatLayer.addTo(map);
    }
  }

  // ── Dropzone & upload ──────────────────────────────────────
  function setupDropzone() {
    const dz = document.getElementById("dropzone");
    const input = document.getElementById("file-input");

    input.addEventListener("change", () => {
      if (input.files[0]) handleFile(input.files[0]);
    });

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.style.borderColor = "var(--saffron)";
    });
    dz.addEventListener("dragleave", () => (dz.style.borderColor = ""));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.style.borderColor = "";
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("preview-img").src = e.target.result;
      document.getElementById("preview-wrap").classList.remove("hidden");
      document.getElementById("dropzone").classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    selectedFile = null;
    document.getElementById("file-input").value = "";
    document.getElementById("preview-wrap").classList.add("hidden");
    document.getElementById("dropzone").classList.remove("hidden");
  }

  function getGPS() {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById("f-lat").value = pos.coords.latitude.toFixed(5);
        document.getElementById("f-lng").value = pos.coords.longitude.toFixed(5);
      },
      () => showError("Could not retrieve location. Please enter coordinates manually.")
    );
  }

  async function submitReport() {
    hideAlerts();
    const lat = document.getElementById("f-lat").value;
    const lng = document.getElementById("f-lng").value;
    const cityId = document.getElementById("f-city").value;
    const severity = document.getElementById("f-severity").value;
    const notes = document.getElementById("f-notes").value;

    if (!selectedFile) { showError("Please select an image first."); return; }
    if (!lat && !lng && !cityId) { showError("Enter GPS coordinates or pick a city."); return; }

    const formData = new FormData();
    formData.append("image", selectedFile);
    if (lat) formData.append("latitude", lat);
    if (lng) formData.append("longitude", lng);
    if (cityId) formData.append("city_id", cityId);
    formData.append("severity", severity);
    formData.append("notes", notes);

    const btn = document.querySelector(".submit-btn");
    btn.disabled = true;
    btn.textContent = "Submitting…";

    try {
      const res = await fetch(`${API}/reports`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      document.getElementById("submit-success").classList.remove("hidden");
      clearImage();
      document.getElementById("f-lat").value = "";
      document.getElementById("f-lng").value = "";
      document.getElementById("f-notes").value = "";

      // Refresh city data & map
      await loadCities();
      buildDotLayer();
      buildHeatLayer();
      setMapMode(mapMode);
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg> Submit report`;
    }
  }

  function showError(msg) {
    const el = document.getElementById("submit-error");
    el.textContent = msg;
    el.classList.remove("hidden");
  }
  function hideAlerts() {
    document.getElementById("submit-success").classList.add("hidden");
    document.getElementById("submit-error").classList.add("hidden");
  }

  // ── Rankings ───────────────────────────────────────────────
  function setupRankFilters() {
    document.querySelectorAll(".pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rankFilter = btn.dataset.filter;
        renderRankings();
      });
    });
  }

  function setupRankSearch() {
    document.getElementById("rank-search").addEventListener("input", renderRankings);
  }

  function renderRankings() {
    const query = document.getElementById("rank-search").value.trim().toLowerCase();
    let list = [...allCities];

    if (rankFilter === "clean") list = list.filter((c) => c.score >= 70).sort((a, b) => b.score - a.score);
    else if (rankFilter === "dirty") list = list.sort((a, b) => b.reportCount - a.reportCount);
    else if (rankFilter === "metro") list = list.filter((c) => c.metro).sort((a, b) => b.score - a.score);
    else list = list.sort((a, b) => b.score - a.score);

    if (query) list = list.filter((c) => c.name.toLowerCase().includes(query) || c.state.toLowerCase().includes(query));

    const body = document.getElementById("rank-body");
    body.innerHTML = "";

    if (list.length === 0) {
      body.innerHTML = '<div class="loading-row">No cities match your search.</div>';
      return;
    }

    list.slice(0, 50).forEach((c, i) => {
      const rank = i + 1;
      const color = scoreToColor(c.score);
      const statusCls = c.score >= 70 ? "status-clean" : c.score >= 40 ? "status-moderate" : "status-dirty";
      const statusLabel = c.score >= 70 ? "Clean" : c.score >= 40 ? "Moderate" : "Dirty";
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

      const row = document.createElement("div");
      row.className = `rank-row rank-${rank}`;
      row.innerHTML = `
        <div class="col-rank">${medal}</div>
        <div>
          <div class="city-name">${c.name}</div>
          <div class="city-state">${c.state}</div>
        </div>
        <div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${c.score}%;background:${color}"></div></div>
          <div class="bar-label">${c.score}/100</div>
        </div>
        <div class="col-reports">${c.reportCount}</div>
        <div><span class="status-tag ${statusCls}">${statusLabel}</span></div>
      `;
      body.appendChild(row);
    });
  }

  return { init, submitReport, getGPS, clearImage, setMapMode };
})();

document.addEventListener("DOMContentLoaded", App.init);
