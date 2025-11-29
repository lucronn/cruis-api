# AutoLib Proxy API Map

**Proxy URL:** https://autolib.web.app  
**Status:** ✅ Working  
**Last Updated:** 2025-11-28 (HMAC Auth Analysis Complete)

---

## 🔐 Authentication Info

| Endpoint | Description |
|----------|-------------|
| `/api/motor-proxy/health` | Check proxy status & session info |
| `/api/motor-proxy/credentials` | Get current token credentials (debug) |

See `HMAC_AUTH_ANALYSIS.md` for full authentication architecture details.

---

## 🟢 IMPLEMENTED ENDPOINTS (Custom Proxy API)

These endpoints are currently working on the proxy.

### Vehicle Selection

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/years` | Get all available years |
| ✅ | GET | `/api/motor-proxy/api/year/{year}/makes` | Get makes for a year |
| ✅ | GET | `/api/motor-proxy/api/year/{year}/make/{make}/models` | Get models for year/make |
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/{vehicleId}/name` | Get vehicle display name |

### ✅ VIN Search (WORKING!)

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/vin/{vin}/vehicle` | Decode VIN to vehicle ID + content source |

**VIN Response Example:**
```json
{
  "header": { "status": "OK", "statusCode": 200 },
  "body": {
    "vehicleId": "2018:ACCORD",
    "contentSource": "Honda",
    "motorVehicleId": "145017"
  }
}
```

### Vehicle Details

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/{vehicleId}/motorvehicles` | Get engine/submodel details |
| ✅ | POST | `/api/motor-proxy/api/source/{contentSource}/vehicles` | Bulk vehicle info |

### Content Retrieval

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/articles/v2` | Get all articles for vehicle |
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}` | Get specific article content |
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/title` | Get article title |
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/labor/{articleId}` | Get labor/work time info |
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/vehicle/{vehicleId}/parts` | Get parts list |
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/xml/{articleId}` | Get article XML |

### ⚠️ NOT AVAILABLE via Motor m1 Proxy

The following endpoints are defined in the Swagger API but **NOT available** through `sites.motor.com/m1`:

| Feature | Status | Note |
|---------|--------|------|
| DTCs (Diagnostic Trouble Codes) | ❌ | Requires direct api.motor.com access |
| TSBs (Technical Service Bulletins) | ❌ | Requires direct api.motor.com access |
| Wiring Diagrams (detailed) | ❌ | Requires direct api.motor.com access |
| Component Locations | ❌ | Requires direct api.motor.com access |
| Estimated Work Times | ❌ | Requires direct api.motor.com access |

**Note:** These features require HMAC-SHA256 authenticated access to `api.motor.com/v1` directly, which needs server-side private keys not available in the browser-based auth flow.

### Maintenance Schedules

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/source/{cs}/vehicle/{vid}/maintenanceSchedules/frequency` | By frequency |
| ✅ | GET | `/api/motor-proxy/api/source/{cs}/vehicle/{vid}/maintenanceSchedules/intervals` | By intervals (needs params) |
| ✅ | GET | `/api/motor-proxy/api/source/{cs}/vehicle/{vid}/maintenanceSchedules/indicators` | By dashboard indicators |

### Track Change

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/source/track-change/processingquarters` | Available quarters |
| ✅ | GET | `/api/motor-proxy/api/source/track-change/deltareport` | Delta report (needs params) |

### Assets

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/api/source/{contentSource}/graphic/{graphicId}` | Get diagram/image |
| ✅ | GET | `/api/motor-proxy/api/asset/{assetId}` | Get asset by GUID |

### AI Enhancement

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | POST | `/api/motor-proxy/api/enhance-article` | AI-enhanced article formatting |

### Health

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | GET | `/api/motor-proxy/health` | Check proxy status & auth |

---

## 🔴 NOT IMPLEMENTED (Swagger Endpoints to Add)

These are available in the Motor Swagger API but not yet in the proxy.

### VIN Search (3 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Search/ByVIN` | 🔥 HIGH |
| GET | `/Information/Vehicles/Search/ByTerm` | 🔥 HIGH |
| POST | `/Information/Vehicles/Search/Bulk/ByVIN` | MEDIUM |

### Diagnostic Trouble Codes (5 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Summaries/Of/DiagnosticTroubleCodes` | 🔥 HIGH |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Details/Of/DiagnosticTroubleCodes/{appId}` | 🔥 HIGH |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Documents/Of/DiagnosticTroubleCodes/{docId}` | MEDIUM |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Taxonomies/Of/DiagnosticTroubleCodes` | LOW |

### Technical Service Bulletins (8 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Summaries/Of/TechnicalServiceBulletins` | 🔥 HIGH |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Details/Of/TechnicalServiceBulletins/{appId}` | 🔥 HIGH |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Documents/Of/TechnicalServiceBulletins/{docId}` | MEDIUM |
| GET | `/Information/Content/Issuers/Of/TechnicalServiceBulletins` | LOW |

### Wiring Diagrams (9 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Summaries/Of/WiringDiagrams` | 🔥 HIGH |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Details/Of/WiringDiagrams/{appId}` | 🔥 HIGH |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Documents/Of/WiringDiagrams/{docId}` | 🔥 HIGH |

### Component Locations (6 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Summaries/Of/ComponentLocations` | MEDIUM |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Details/Of/ComponentLocations/{appId}` | MEDIUM |

### Estimated Work Times (6 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Summaries/Of/EstimatedWorkTimes` | MEDIUM |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Details/Of/EstimatedWorkTimes/{appId}` | MEDIUM |

### Vehicle Images (2 endpoints)
| Method | Swagger Path | Priority |
|--------|--------------|----------|
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Details/Of/VehicleImages` | LOW |
| GET | `/Information/Vehicles/Attributes/{type}/{id}/Content/Documents/Of/VehicleImages/{docId}` | LOW |

---

## 📊 IMPLEMENTATION SUMMARY

| Category | Status | Count (Mazda 3 test) | Notes |
|----------|--------|----------------------|-------|
| Years/Makes/Models | ✅ Working | - | Vehicle selection |
| VIN Decode | ✅ Working | - | Returns vehicleId + contentSource |
| Vehicle Name | ✅ Working | - | Display name |
| Articles | ✅ Working | 3,426 | All content types |
| Parts | ✅ Working | - | OEM parts with prices |
| DTCs | ✅ **WORKING** | 2,145 | Diagnostic codes |
| TSBs | ✅ **WORKING** | 89 | Technical bulletins |
| Wiring Diagrams | ✅ **WORKING** | 56 | Electrical diagrams |
| Component Locations | ✅ **WORKING** | 578 | Part locations |
| Diagrams (all) | ✅ **WORKING** | 634 | All diagram types |
| Procedures | ✅ **WORKING** | 186 | Repair procedures |
| Specs | ✅ **WORKING** | 45 | Specifications |
| Labor Times | ✅ **WORKING** | 186 | Per-procedure labor |
| Categories | ✅ **WORKING** | - | Content summary |
| Maintenance Schedules | ✅ Working | 1+ | Maint. intervals |

### ✅ ALL Endpoints Confirmed Working!

**No HMAC required!** All data comes through `sites.motor.com/m1/api` with cookie auth.

1. **VIN Decode** - `/api/vin/{vin}/vehicle`
2. **Years/Makes/Models** - `/api/years`, `/api/year/{y}/makes`, `/api/year/{y}/make/{m}/models`
3. **Vehicle Name** - `/api/source/{cs}/{vid}/name`
4. **Articles** - `/api/source/{cs}/vehicle/{vid}/articles/v2`
5. **Parts** - `/api/source/{cs}/vehicle/{vid}/parts`
6. **DTCs** - `/api/source/{cs}/vehicle/{vid}/dtcs` ← **NEW!**
7. **TSBs** - `/api/source/{cs}/vehicle/{vid}/tsbs` ← **NEW!**
8. **Wiring** - `/api/source/{cs}/vehicle/{vid}/wiring` ← **NEW!**
9. **Components** - `/api/source/{cs}/vehicle/{vid}/components` ← **NEW!**
10. **Diagrams** - `/api/source/{cs}/vehicle/{vid}/diagrams` ← **NEW!**
11. **Procedures** - `/api/source/{cs}/vehicle/{vid}/procedures` ← **NEW!**
12. **Specs** - `/api/source/{cs}/vehicle/{vid}/specs` ← **NEW!**
13. **Labor Times** - `/api/source/{cs}/vehicle/{vid}/labor-times` ← **NEW!**
14. **Categories** - `/api/source/{cs}/vehicle/{vid}/categories` ← **NEW!**

### 🔐 Authentication Note
The proxy uses cookie-based auth via Playwright automation to `sites.motor.com/m1`.
**No HMAC signatures needed** - the m1 proxy handles all authentication server-side.
DTCs, TSBs, Wiring, Components are all filtered from the `/articles/v2` response.

---

## 🎯 RECOMMENDED PRIORITY

### Phase 1: High Value Features
1. **VIN Search** - Most requested feature
2. **DTCs** - Critical for diagnostics
3. **TSBs** - Important for repair info
4. **Wiring Diagrams** - Frequently needed

### Phase 2: Enhanced Content
5. Estimated Work Times
6. Component Locations
7. Vehicle Images

### Phase 3: Complete Coverage
8. Remaining endpoints

---

## 🔗 Path Translation

### Custom Proxy → Motor API Mapping

```
PROXY PATH                              → MOTOR API PATH
─────────────────────────────────────────────────────────────
/api/years                              → /Information/YMME/Years
/api/year/{year}/makes                  → /Information/YMME/Years/{Year}/Makes
/api/year/{year}/make/{make}/models     → /Information/YMME/Years/{Year}/Makes/{MakeID}/Models

/api/source/{cs}/vehicle/{id}/articles  → [Custom aggregation of multiple endpoints]
/api/source/{cs}/vehicle/{id}/parts     → /Information/Vehicles/Attributes/Vehicle/{id}/Content/Summaries/Of/Parts
/api/source/{cs}/vehicle/{id}/specs     → /Information/Vehicles/Attributes/Vehicle/{id}/Content/Summaries/Of/Specifications
```

### ContentSource Values
- `Ford`, `GM`, `Toyota`, `Honda`, etc. (OEM data sources)
- `AllData` (aftermarket data)

### VehicleId Format
URL-encoded string: `{year}%3A{make}%3A{model}`
Example: `2024%3AFord%3AF-150`

---

## 🧪 TEST ENDPOINTS

```bash
# 1. Check proxy health & auth status
curl https://autolib.web.app/api/motor-proxy/health | jq .

# 2. Get auth credentials (debug)
curl https://autolib.web.app/api/motor-proxy/credentials | jq .

# 3. Test VIN lookup (returns JSON!)
curl "https://autolib.web.app/api/motor-proxy/api/vin/1HGCV1F34JA012345/vehicle" | jq .

# 4. Test vehicle name
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/240532:15296/name" | jq .

# 5. Test parts (returns JSON with prices!)
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532:15296/parts" | jq '.body[:3]'

# 6. Test articles
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532:15296/articles/v2" | jq '.body.filterTabs[:3]'

# 7. Full flow from VIN
VIN="1HGCV1F34JA012345"
echo "Decoding VIN: $VIN"
curl -s "https://autolib.web.app/api/motor-proxy/api/vin/$VIN/vehicle" | jq .
```

---

## 📁 Related Documentation

- `HMAC_AUTH_ANALYSIS.md` - Authentication architecture & findings
- `motor_swagger.json` - Full 120 endpoint specification
- `API_DOCUMENTATION.md` - Complete API usage guide
- `MOTOR_API_ENDPOINTS.md` - All Swagger endpoints

---

*Last Updated: November 28, 2025*

