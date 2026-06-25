<div align="center">
  <img src="assets/banner.svg" alt="Swachh Bharat Monitor Banner" width="800" />

  # 🇮🇳 Swachh Bharat Monitor
  
  <p><strong>A crowd-sourced civic tech cleanliness tracking web app for 1000 Indian cities.</strong></p>

  <p>
    <a href="https://github.com/ishandutta2007/Awesome-Awesome-Awesome"><img src="https://img.shields.io/badge/Awesome-%E2%9C%94-blueviolet?style=flat-square&logo=github" alt="Awesome"/></a>
    <a href="https://discord.gg/jc4xtF58Ve"><img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a>
    <a href="https://github.com/ishandutta2007"><img alt="GitHub followers" src="https://img.shields.io/github/followers/ishandutta2007?label=Follow" /></a>
  </p>
</div>

Citizens upload photos of garbage sightings — tagged with GPS coordinates — and the app maps each report to the nearest city, computes a live cleanliness score, and renders an interactive heatmap of India.

---

## ✨ Features

- 🗺️ **Interactive India Heatmap** — city dots colour-coded from green (clean) to red (dirty), togglable heat layer for tracking waste management issues.
- 📸 **Report Submission** — garbage sighting photo upload with automatic GPS-to-city mapping (25 km radius).
- 🏆 **Live Rankings** — top 50 cities ranked by cleanliness score, filterable and searchable for urban tracking.
- 🔌 **REST API** — ready for mobile app integration (see [API Reference](#-api-reference)).
- 📉 **Decay-weighted Scoring** — recent reports penalise cities more than old ones (half-life: 1 week).
- 🌱 **Seed Data** — demo reports pre-loaded for 30+ cities so the map isn't empty on first run.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express |
| Storage | In-memory (swap for PostgreSQL + PostGIS for production) |
| File uploads | Multer |
| Frontend map | Leaflet.js + Leaflet.heat |
| Tiles | OpenStreetMap |
| Styling | Vanilla CSS (no framework) |

---

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 💻 Install & Run

```bash
git clone https://github.com/YOUR_USERNAME/swachh-bharat.git
cd swachh-bharat
npm install
npm start
```

Open **http://localhost:3000** in your browser to view the application.

For development with auto-reload:
```bash
npm run dev
```

---

## 📁 Project Structure

```text
swachh-bharat/
├── backend/
│   ├── server.js          # Express entry point
│   ├── routes/
│   │   ├── cities.js      # GET /api/v1/cities
│   │   ├── reports.js     # POST /api/v1/reports
│   │   └── heatmap.js     # GET /api/v1/heatmap
│   └── data/
│       ├── cities.js      # 100 cities seed data (extend to 1000)
│       └── store.js       # In-memory data store & scoring logic
├── frontend/
│   ├── index.html         # Single-page app shell
│   ├── css/style.css      # All styles
│   └── js/app.js          # Frontend logic (tabs, map, form, rankings)
├── uploads/               # Uploaded images (git-ignored)
├── docs/
│   └── api.md             # API reference (extended)
├── package.json
├── .gitignore
└── README.md
```

---

## 📡 API Reference

Base URL: `http://localhost:3000/api/v1`

### POST `/reports`
Submit a garbage sighting.

**Body** (`multipart/form-data`):
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `image` | file | ✅ | JPEG/PNG/WebP, max 10 MB |
| `latitude` | float | ✅* | GPS latitude |
| `longitude` | float | ✅* | GPS longitude |
| `city_id` | string | ✅* | 3-letter city code (alternative to GPS) |
| `severity` | string | | `"low"` / `"medium"` / `"high"` |
| `notes` | string | | Free text |

*Either `(latitude + longitude)` or `city_id` is required.

**Response 201:**
```json
{
  "message": "Report submitted successfully",
  "report": { "id": "uuid", "cityId": "MUM", "cityName": "Mumbai", "score": 42 },
  "updatedScore": 42
}
```

---

### GET `/cities`
Ranked list of all tracked cities.

| Param | Default | Notes |
|-------|---------|-------|
| `state` | — | Filter by state name |
| `sort` | `score` | `score` or `reports` |
| `limit` | all | Max results |

---

### GET `/cities/:id`
Single city by 3-letter ID (e.g. `MUM`, `DEL`, `BLR`).

---

### GET `/cities/:id/reports`
Recent reports for a city.

| Param | Default |
|-------|---------|
| `page` | 1 |
| `per_page` | 20 |

---

### GET `/heatmap`
All individual report points as `{ lat, lng, intensity, cityId, cityName }`.

### GET `/heatmap/cities`
City-level aggregated points — one entry per city with `score` and `intensity` (0–1).

---

## 📈 Extending to 1000 Cities

The seed data in `backend/data/cities.js` contains 100 cities. To extend:

1. Add more city objects to the array following the same schema:
   ```js
   { id: "XXX", name: "City Name", state: "State", lat: 00.0000, lng: 00.0000, metro: false }
   ```
2. IDs must be unique 3-letter strings.
3. Coordinates must be decimal degrees (WGS84).

A full 1000-city dataset can be sourced from [Census of India](https://censusindia.gov.in/) or OpenStreetMap's Nominatim API.

---

## 🛣️ Production Roadmap

| What | How |
|------|-----|
| 💾 Persistent storage | Replace `store.js` with PostgreSQL + PostGIS (use `ST_DWithin` for GPS→city lookup) |
| ☁️ Image storage | Move `uploads/` to AWS S3 or Cloudflare R2 |
| 🔒 Auth for mobile API | Add JWT middleware on `POST /reports` |
| 🛑 Rate limiting | `express-rate-limit` on the reports endpoint |
| 🚀 Deploy | Render, Railway, or a VPS |

---

## 🤝 Contributing

PRs welcome — especially for:
- 🏙️ More city data
- 🗺️ State-level filtering on the heatmap
- 📱 Mobile-responsive improvements

---

## 📜 License

MIT
