const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { addReport, findNearestCity, getCityById } = require("../data/store");

// Multer config — store images in /uploads with original extension
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|heic)/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, or HEIC images are accepted"));
  },
});

// POST /api/v1/reports
// Body (multipart/form-data):
//   image       File     Required
//   latitude    float    Required
//   longitude   float    Required
//   severity    string   "low" | "medium" | "high"   default: "medium"
//   city_id     string   Optional — overrides GPS mapping
//   notes       string   Optional
router.post("/", upload.single("image"), (req, res) => {
  const { latitude, longitude, severity, city_id, notes } = req.body;

  // Resolve city
  let city = null;
  if (city_id) {
    city = getCityById(city_id.toUpperCase());
    if (!city) return res.status(400).json({ error: `Unknown city_id: ${city_id}` });
  } else if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng))
      return res.status(400).json({ error: "latitude and longitude must be numbers" });
    city = findNearestCity(lat, lng);
    if (!city)
      return res.status(422).json({
        error: "No tracked city within 25 km of the provided coordinates.",
      });
  } else {
    return res.status(400).json({
      error: "Provide either (latitude + longitude) or city_id",
    });
  }

  const validSeverities = ["low", "medium", "high"];
  const resolvedSeverity = validSeverities.includes(severity) ? severity : "medium";

  const report = addReport({
    cityId: city.id,
    severity: resolvedSeverity,
    lat: parseFloat(latitude) || city.lat,
    lng: parseFloat(longitude) || city.lng,
    notes: notes || "",
    imagePath: req.file ? `/uploads/${req.file.filename}` : null,
  });

  res.status(201).json({
    message: "Report submitted successfully",
    report: {
      id: report.id,
      cityId: city.id,
      cityName: city.name,
      state: city.state,
      severity: report.severity,
      imagePath: report.imagePath,
      createdAt: report.createdAt,
    },
    updatedScore: city.score,
  });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
