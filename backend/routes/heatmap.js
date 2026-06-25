const express = require("express");
const router = express.Router();
const { getHeatmapPoints, getAllCities } = require("../data/store");

// GET /api/v1/heatmap
// Returns point data for Leaflet/Mapbox heatmap layers on mobile apps
router.get("/", (req, res) => {
  const points = getHeatmapPoints();
  res.json({
    count: points.length,
    points,
  });
});

// GET /api/v1/heatmap/cities
// Returns city-level aggregated data: one point per city with score + intensity
router.get("/cities", (req, res) => {
  const cities = getAllCities();
  const data = cities.map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    lat: c.lat,
    lng: c.lng,
    score: c.score,
    reportCount: c.reportCount,
    // intensity 0–1 for heatmap rendering (inverted: more reports = hotter)
    intensity: c.reportCount > 0 ? Math.min(1, c.reportCount / 20) : 0,
  }));
  res.json({ count: data.length, cities: data });
});

module.exports = router;
