const express = require("express");
const router = express.Router();
const { getAllCities, getCityById } = require("../data/store");

// GET /api/v1/cities
// Query params: state, sort (score|reports), limit
router.get("/", (req, res) => {
  const { state, sort, limit } = req.query;
  const cities = getAllCities({ state, sort, limit });
  res.json({
    count: cities.length,
    cities: cities.map(formatCity),
  });
});

// GET /api/v1/cities/:id
router.get("/:id", (req, res) => {
  const city = getCityById(req.params.id.toUpperCase());
  if (!city) return res.status(404).json({ error: "City not found" });
  res.json(formatCity(city));
});

// GET /api/v1/cities/:id/reports
router.get("/:id/reports", (req, res) => {
  const city = getCityById(req.params.id.toUpperCase());
  if (!city) return res.status(404).json({ error: "City not found" });

  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 20;
  const start = (page - 1) * perPage;
  const reports = city.reports.slice(start, start + perPage);

  res.json({
    cityId: city.id,
    cityName: city.name,
    total: city.reportCount,
    page,
    perPage,
    reports,
  });
});

function formatCity(c) {
  return {
    id: c.id,
    name: c.name,
    state: c.state,
    lat: c.lat,
    lng: c.lng,
    metro: c.metro,
    score: c.score,
    reportCount: c.reportCount,
    status: c.score >= 70 ? "clean" : c.score >= 40 ? "moderate" : "dirty",
  };
}

module.exports = router;
