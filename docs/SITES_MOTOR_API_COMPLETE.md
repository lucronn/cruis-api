# sites.motor.com/m1 API - Complete Endpoint Reference

**Source:** Angular app analysis + HAR file testing  
**Last Updated:** November 29, 2025  
**Status:** ✅ All previously "HMAC-only" endpoints now working via cookie auth!

---

## ✅ CONFIRMED WORKING (Returns JSON)

### Vehicle Selection

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/years` | All available model years | ✅ |
| GET | `/api/year/{year}/makes` | Makes for a specific year | ✅ |
| GET | `/api/year/{year}/make/{make}/models` | Models with engines | ✅ |
| GET | `/api/motor/year/{year}/make/{make}/models` | Alt path (same result) | ✅ |
| GET | `/api/vin/{vin}/vehicle` | VIN decode → vehicleId + contentSource | ✅ |

### Vehicle Info

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/source/{cs}/{vehicleId}/name` | Vehicle display name | ✅ |
| GET | `/api/source/{cs}/{vehicleId}/motorvehicles` | Engine/submodel details | ✅ |
| POST | `/api/source/{cs}/vehicles` | Bulk vehicle info | ⏳ |

### Articles & Content

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/source/{cs}/vehicle/{vid}/articles/v2` | All articles (with search) | ✅ |
| GET | `/api/source/{cs}/vehicle/{vid}/articles/v2?searchTerm=X` | Search articles | ✅ |
| GET | `/api/source/{cs}/vehicle/{vid}/article/{articleId}` | Article HTML content | ✅ |
| GET | `/api/source/{cs}/vehicle/{vid}/article/{articleId}/title` | Article title | ⚠️ (500 on some) |
| POST | `/api/source/{cs}/vehicle/{vid}/article/{articleId}/bookmark` | Save bookmark | ⏳ |
| GET | `/api/source/{cs}/vehicle/{vid}/labor/{articleId}` | Labor info for article | ✅ |
| GET | `/api/source/{cs}/xml/{articleId}` | Article raw XML | ✅ |

### Parts

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/source/{cs}/vehicle/{vid}/parts` | OEM parts with prices | ✅ |

### Maintenance Schedules

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/source/{cs}/vehicle/{vid}/maintenanceSchedules/frequency` | By frequency | ✅ |
| GET | `/api/source/{cs}/vehicle/{vid}/maintenanceSchedules/intervals?intervalType=X&interval=N` | By intervals | ⚠️ (needs params) |
| GET | `/api/source/{cs}/vehicle/{vid}/maintenanceSchedules/indicators` | By dashboard indicators | ✅ |

### Graphics & Assets

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/source/{cs}/graphic/{id}` | Diagram/image | ✅ |
| GET | `/api/asset/{handleId}` | Asset by GUID | ✅ |
| GET | `/api/manufacturer/{manufacturerId}/graphic/{id}` | Manufacturer graphic | ⏳ |

### Track Change

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/source/track-change/processingquarters` | Available quarters | ✅ |
| GET | `/api/source/track-change/deltareport?vehicleId=X&processingQuarter=Y` | Delta report | ⏳ |

### Bookmarks

| Method | Endpoint | Description | Tested |
|--------|----------|-------------|--------|
| GET | `/api/bookmark/{bookmarkId}` | Get saved bookmark | ⏳ |
| DELETE | `/api/bookmark/{bookmarkId}` | Delete bookmark | ⏳ |

---

## ❌ NOT JSON ENDPOINTS (UI Resources)

These return HTML/CSS/images, not JSON data:

| Endpoint | Returns |
|----------|---------|
| `/api/ui/banner` | HTML |
| `/api/ui/banner.html` | HTML |
| `/api/ui/css/bootstrap` | CSS |
| `/api/ui/favicon` | Image |
| `/api/ui/feedbackconfigurations` | JSON (config) |
| `/api/ui/usersettings` | JSON (settings) |

---

## ✅ SPECIALIZED ENDPOINTS (All Working via Articles API)

**Discovery:** These are all filtered subsets of the `/articles/v2` response, accessed via dedicated proxy endpoints:

| Endpoint | Bucket Filter | Count (Mazda 3) | Tested |
|----------|---------------|-----------------|--------|
| `/api/source/{cs}/vehicle/{vid}/dtcs` | "Diagnostic Trouble Codes" | 2,145 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/tsbs` | "Technical Service Bulletins" | 89 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/wiring` | "Wiring Diagrams" | 56 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/components` | "Component Location Diagrams" | 578 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/diagrams` | All diagram types | 634 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/procedures` | parentBucket: "Procedures" | 186 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/specs` | "Specifications" | 45 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/labor-times` | Operations with labor | 186 | ✅ |
| `/api/source/{cs}/vehicle/{vid}/categories` | Summary of all categories | - | ✅ |

**Note:** No HMAC auth required! All data comes from the m1 proxy's `/articles/v2` endpoint and is filtered by the `bucket` property.

---

## 📋 Parameter Reference

### Content Sources
- `MOTOR` - MOTOR database
- `Ford`, `GM`, `Toyota`, `Honda`, etc. - OEM-specific
- `AllData` - Aftermarket

### Vehicle ID Format
URL-encoded: `{id}:{engineId}` or just `{id}`
Example: `240532:15296` → `240532%3A15296`

### Maintenance Schedule Params
- `intervalType`: `miles` or `months`
- `interval`: Number (e.g., `5000`, `12`)
- `severity`: `Normal` or `Severe`

---

## 🧪 Test Commands

```bash
# Years
curl "https://autolib.web.app/api/motor-proxy/api/years" | jq '.body[:5]'

# VIN Decode
curl "https://autolib.web.app/api/motor-proxy/api/vin/1HGCV1F34JA012345/vehicle" | jq .

# Vehicle Name
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/240532%3A15296/name" | jq .

# Motor Vehicles (engines/submodels)
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/240532%3A15296/motorvehicles" | jq .

# Parts
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532%3A15296/parts" | jq '.body[:3]'

# Articles
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532%3A15296/articles/v2" | jq '.body.filterTabs'

# Maintenance by Indicators
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532%3A15296/maintenanceSchedules/indicators" | jq '.body.indicators[:2]'

# Track Change Quarters
curl "https://autolib.web.app/api/motor-proxy/api/source/track-change/processingquarters" | jq .
```

---

## 📊 Summary

| Category | Endpoints | Working |
|----------|-----------|---------|
| Vehicle Selection | 5 | ✅ All |
| Vehicle Info | 3 | ✅ 2/3 |
| Articles | 6 | ✅ 5/6 |
| Parts | 1 | ✅ All |
| Diagnostics (DTCs, TSBs) | 2 | ✅ All |
| Diagrams (Wiring, Components, All) | 3 | ✅ All |
| Procedures & Specs | 3 | ✅ All |
| Labor & Categories | 2 | ✅ All |
| Maintenance | 3 | ✅ 2/3 |
| Graphics | 3 | ✅ 2/3 |
| Track Change | 2 | ✅ 1/2 |
| Bookmarks | 2 | ⏳ Untested |
| **Total** | **35+** | **~30 working** |

---

**Last Updated:** November 29, 2025

*Generated from Angular app source analysis and live API testing. All "HMAC-only" endpoints now confirmed working via cookie auth.*

