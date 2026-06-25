const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const citiesRouter = require("./routes/cities");
const reportsRouter = require("./routes/reports");
const heatmapRouter = require("./routes/heatmap");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(uploadsDir));

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "frontend")));

// API routes
app.use("/api/v1/cities", citiesRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/heatmap", heatmapRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback: serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🇮🇳  Swachh Bharat Monitor running at http://localhost:${PORT}`);
  console.log(`   API base: http://localhost:${PORT}/api/v1\n`);
});

module.exports = app;
