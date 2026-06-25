// In-memory store for reports and city scores.
// Replace with a real database (PostgreSQL + PostGIS recommended) for production.

const { v4: uuidv4 } = require("uuid");
const cities = require("./cities");

// Initialise city score map
const cityScores = {};
cities.forEach((c) => {
  cityScores[c.id] = {
    ...c,
    reportCount: 0,
    score: 100,
    reports: [],
  };
});

// Seed some demo data so the app isn't empty on first load
const seedReports = [
  { cityId: "MUM", severity: "high",   lat: 18.96, lng: 72.83, notes: "Large dump near Dharavi" },
  { cityId: "MUM", severity: "high",   lat: 18.97, lng: 72.84, notes: "Overflowing bins near Kurla" },
  { cityId: "MUM", severity: "medium", lat: 18.95, lng: 72.81, notes: "Scattered litter on footpath" },
  { cityId: "DEL", severity: "high",   lat: 28.65, lng: 77.20, notes: "Garbage pile near Yamuna bank" },
  { cityId: "DEL", severity: "medium", lat: 28.67, lng: 77.22, notes: "Overflowing bin in market" },
  { cityId: "KOL", severity: "high",   lat: 22.57, lng: 88.37, notes: "Litter near Lake Market" },
  { cityId: "MYS", severity: "low",    lat: 12.30, lng: 76.64, notes: "Minor litter near city centre" },
  { cityId: "IND", severity: "low",    lat: 22.72, lng: 75.86, notes: "Swept street, minor mess" },
  { cityId: "CHD", severity: "low",    lat: 30.73, lng: 76.78, notes: "Small wrapper near bus stop" },
  { cityId: "PAT", severity: "high",   lat: 25.59, lng: 85.14, notes: "Heap near Patna Junction" },
  { cityId: "PAT", severity: "high",   lat: 25.60, lng: 85.15, notes: "Garbage near Ganga ghat" },
  { cityId: "KAN", severity: "high",   lat: 26.46, lng: 80.32, notes: "Open dumping on roadside" },
];

const severityWeight = { low: 1, medium: 2, high: 4 };

function addReport({ cityId, severity, lat, lng, notes, imagePath }) {
  if (!cityScores[cityId]) return null;

  const report = {
    id: uuidv4(),
    cityId,
    severity,
    lat,
    lng,
    notes: notes || "",
    imagePath: imagePath || null,
    createdAt: new Date().toISOString(),
  };

  cityScores[cityId].reports.unshift(report);
  cityScores[cityId].reportCount++;
  recalcScore(cityId);
  return report;
}

function recalcScore(cityId) {
  const city = cityScores[cityId];
  if (!city) return;

  // Weighted score: more recent reports decay slower
  // Score = 100 - min(100, Σ weight_i * decay_i)
  const now = Date.now();
  let penalty = 0;
  city.reports.forEach((r) => {
    const ageHours = (now - new Date(r.createdAt).getTime()) / 3600000;
    const decay = Math.exp(-ageHours / 168); // half-life ~1 week
    penalty += severityWeight[r.severity] * decay;
  });
  city.score = Math.max(0, Math.round(100 - Math.min(100, penalty * 3)));
}

function getCityById(id) {
  return cityScores[id] || null;
}

function getAllCities({ state, sort, limit } = {}) {
  let list = Object.values(cityScores);
  if (state) list = list.filter((c) => c.state.toLowerCase() === state.toLowerCase());
  if (sort === "reports") list.sort((a, b) => b.reportCount - a.reportCount);
  else list.sort((a, b) => b.score - a.score);
  if (limit) list = list.slice(0, Number(limit));
  return list;
}

function getHeatmapPoints() {
  const points = [];
  Object.values(cityScores).forEach((city) => {
    city.reports.forEach((r) => {
      points.push({
        lat: r.lat,
        lng: r.lng,
        intensity: severityWeight[r.severity],
        cityId: city.id,
        cityName: city.name,
      });
    });
  });
  return points;
}

function findNearestCity(lat, lng, maxKm = 25) {
  let best = null;
  let bestDist = Infinity;
  Object.values(cityScores).forEach((c) => {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestDist) { bestDist = d; best = c; }
  });
  return bestDist <= maxKm ? best : null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Seed demo data
seedReports.forEach((s) => addReport(s));

module.exports = { addReport, getCityById, getAllCities, getHeatmapPoints, findNearestCity };
