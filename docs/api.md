# Swachh Bharat Monitor — API Reference

This document is the full REST API reference for mobile app developers connecting to the Swachh Bharat Monitor backend.

## Base URL

```
http://localhost:3000/api/v1     (development)
https://your-domain.com/api/v1   (production)
```

## Authentication

Currently open. For production, add an `Authorization: Bearer <token>` header on mutation endpoints (`POST /reports`). Contact the project maintainer for API keys.

## Error format

All errors return JSON:
```json
{ "error": "Human-readable error message" }
```

Common HTTP status codes:
- `400` — Bad request (missing fields, invalid values)
- `404` — City not found
- `413` — Image too large (>10 MB)
- `422` — No tracked city within 25 km of GPS coordinates

---

## Endpoints

### POST /reports

Submit a garbage sighting.

```
POST /api/v1/reports
Content-Type: multipart/form-data
```

#### Request fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | ✅ | Photo of the sighting. JPEG, PNG, WebP or HEIC. Max 10 MB. |
| `latitude` | Float | ✅* | GPS latitude in decimal degrees |
| `longitude` | Float | ✅* | GPS longitude in decimal degrees |
| `city_id` | String | ✅* | 3-letter city code. Use instead of GPS if coordinates unavailable. |
| `severity` | String | | `"low"` (minor litter), `"medium"` (moderate garbage, default), `"high"` (large dump) |
| `notes` | String | | Optional free text, max 500 chars |

*Either `latitude`+`longitude` **or** `city_id` is required.

#### GPS mapping

When coordinates are provided, the server finds the nearest tracked city within **25 km**. If no city is within range, it returns `422`.

#### Example (JavaScript fetch)

```js
const form = new FormData();
form.append("image", imageFile);
form.append("latitude", 19.076);
form.append("longitude", 72.877);
form.append("severity", "high");
form.append("notes", "Large heap near market");

const res = await fetch("https://your-domain.com/api/v1/reports", {
  method: "POST",
  body: form,
});
const data = await res.json();
```

#### Response 201

```json
{
  "message": "Report submitted successfully",
  "report": {
    "id": "3f2a1b4c-...",
    "cityId": "MUM",
    "cityName": "Mumbai",
    "state": "Maharashtra",
    "severity": "high",
    "imagePath": "/uploads/1705312345-abc123.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "updatedScore": 38
}
```

---

### GET /cities

Ranked list of all tracked cities.

```
GET /api/v1/cities
GET /api/v1/cities?state=Karnataka&sort=score&limit=10
```

#### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `state` | String | — | Filter by exact state name |
| `sort` | String | `score` | `score` (cleanest first) or `reports` (most reported first) |
| `limit` | Integer | all | Maximum number of results |

#### Response 200

```json
{
  "count": 100,
  "cities": [
    {
      "id": "MYS",
      "name": "Mysuru",
      "state": "Karnataka",
      "lat": 12.2958,
      "lng": 76.6394,
      "metro": false,
      "score": 92,
      "reportCount": 3,
      "status": "clean"
    }
  ]
}
```

`status` is derived: `"clean"` (score ≥ 70), `"moderate"` (40–69), `"dirty"` (< 40).

---

### GET /cities/:id

Single city detail.

```
GET /api/v1/cities/MUM
```

Returns same shape as a single element in the `/cities` array.

---

### GET /cities/:id/reports

Paginated list of recent reports for a city.

```
GET /api/v1/cities/MUM/reports?page=1&per_page=20
```

#### Query parameters

| Param | Default |
|-------|---------|
| `page` | 1 |
| `per_page` | 20 |

#### Response 200

```json
{
  "cityId": "MUM",
  "cityName": "Mumbai",
  "total": 47,
  "page": 1,
  "perPage": 20,
  "reports": [
    {
      "id": "uuid",
      "cityId": "MUM",
      "severity": "high",
      "lat": 19.076,
      "lng": 72.877,
      "notes": "Large heap near market",
      "imagePath": "/uploads/...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /heatmap

All individual report points. Use with Leaflet.heat or Mapbox GL heatmap layers.

```
GET /api/v1/heatmap
```

#### Response 200

```json
{
  "count": 312,
  "points": [
    { "lat": 18.96, "lng": 72.83, "intensity": 4, "cityId": "MUM", "cityName": "Mumbai" }
  ]
}
```

`intensity` is the severity weight: `low=1`, `medium=2`, `high=4`.

---

### GET /heatmap/cities

City-level aggregated heatmap — one point per city.

```
GET /api/v1/heatmap/cities
```

#### Response 200

```json
{
  "count": 100,
  "cities": [
    {
      "id": "MUM",
      "name": "Mumbai",
      "state": "Maharashtra",
      "lat": 18.9667,
      "lng": 72.8333,
      "score": 38,
      "reportCount": 12,
      "intensity": 0.8
    }
  ]
}
```

`intensity` is clamped to 0–1 and represents how heavily reported a city is.

---

### GET /health

Server health check.

```
GET /api/health
```

```json
{ "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }
```
