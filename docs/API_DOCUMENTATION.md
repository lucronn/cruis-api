# YourCar API Documentation

Complete API documentation for the YourCar Vehicle Information System proxy service.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Credentials (Debug)](#credentials-debug)
  - [VIN Lookup](#vin-lookup)
  - [Vehicle Selection](#vehicle-selection)
  - [Search](#search)
  - [Articles & Assets](#articles--assets)
  - [Parts](#parts)
  - [Diagnostics (DTCs)](#diagnostics-dtcs)
  - [Technical Service Bulletins (TSBs)](#technical-service-bulletins-tsbs)
  - [Wiring Diagrams](#wiring-diagrams)
  - [Component Locations](#component-locations)
  - [Procedures](#procedures)
  - [Diagrams (All Types)](#diagrams-all-types)
  - [Specifications](#specifications)
  - [Categories](#categories)
  - [Labor Operations](#labor-operations)
  - [Maintenance Schedules](#maintenance-schedules)
  - [Specifications & Fluids](#specifications--fluids)
  - [Bookmarks](#bookmarks)
  - [Track Change](#track-change)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [OpenAPI Schema](#openapi-schema)

## Overview

The YourCar API is a proxy service that provides authenticated access to Motor.com M1 endpoints through a Firebase Cloud Function. The proxy handles authentication automatically using Playwright with a library card, eliminating the need for client-side authentication.

**Key Features:**
- Automatic server-side authentication
- Single shared session for all clients
- CORS-enabled for web applications
- Binary image support
- Comprehensive error handling

## Base URL

**Production:**
```
https://motorproxy-erohrfg7qa-uc.a.run.app
```

**Local Development:**
```
http://localhost:5001
```

All API endpoints are prefixed with `/api/motor-proxy` when accessed through the proxy, but the proxy automatically routes requests to the correct Motor.com M1 endpoints.

## Authentication

Authentication is handled **automatically** by the server. No authentication headers or tokens are required from clients.

**How it works:**
1. The server maintains a single authentication session using Playwright
2. Authentication is performed automatically when needed
3. Sessions are cached and reused until expiration
4. All requests are automatically authenticated

**Session Management:**
- Sessions expire based on Motor.com token expiration (typically 24 hours)
- Expired sessions are automatically renewed
- Multiple concurrent requests share the same session

## Response Structure

**Important:** Most API endpoints return responses in the following structure:

```json
{
  "header": {
    "messages": [],
    "date": "Wed, 19 Nov 2025 06:22:13 GMT",
    "status": "OK",
    "statusCode": 200
  },
  "body": { /* actual response data */ }
}
```

- **`header`**: Contains metadata about the response including status, date, and any messages
- **`body`**: Contains the actual response data (array, object, or primitive value)
- **Exception**: The `/health` endpoint returns a different structure without the `header`/`body` wrapper

When accessing response data, use `response.body` (or `response.data` for the health endpoint).

## Endpoints

### Health Check

#### `GET /health`

Check the health status of the API proxy and authentication session.

**Response:**
```json
{
  "status": "ok",
  "authenticated": true,
  "sessionId": "31018b43-ed6b-42f4-b7c3-8628cfede94c",
  "expiresAt": "2025-11-19T16:11:51.000Z",
  "timestamp": "2025-11-19T06:22:12.447Z"
}
```

**Real Example Response (tested 2025-11-19):**
```json
{
  "status": "ok",
  "authenticated": true,
  "sessionId": "31018b43-ed6b-42f4-b7c3-8628cfede94c",
  "expiresAt": "2025-11-19T16:11:51.000Z",
  "timestamp": "2025-11-19T06:22:12.447Z"
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/health
```

---

### Credentials (Debug)

#### `GET /api/motor-proxy/credentials`

Get the current authentication credentials (for debugging purposes).

**Response:**
```json
{
  "publicKey": "S5dFutoiQg",
  "apiTokenKey": "CHyZO",
  "apiTokenValue": "PLOZ9XKYGUUO6MwhxucuqYry8",
  "expiration": "2025-11-29T03:50:13Z",
  "userName": "TruSpeedTrialEBSCO",
  "subscriptions": ["TruSpeed"],
  "tokenAuthHeader": "Token S5dFutoiQg:PLOZ9XKYGUUO6MwhxucuqYry8"
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/credentials
```

---

### VIN Lookup

#### `GET /api/vin/{vin}/vehicle`

Decode a VIN (Vehicle Identification Number) to get vehicle details.

**Path Parameters:**
- `vin` (string, required): 17-character VIN

**Response:**
```json
{
  "header": {
    "messages": [],
    "date": "Fri, 28 Nov 2025 18:10:25 GMT",
    "status": "OK",
    "statusCode": 200
  },
  "body": {
    "vehicleId": "2018:ACCORD",
    "contentSource": "Honda",
    "vehicleIdChoices": "",
    "motorVehicleId": "145017"
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/vin/1HGCV1F34JA012345/vehicle
```

**Use Case:** Start with a VIN to get the `vehicleId` and `contentSource` needed for all other API calls.

---

### Vehicle Selection

#### `GET /api/years`

Get all available vehicle model years.

**Response:**
```json
{
  "header": {
    "messages": [],
    "date": "Wed, 19 Nov 2025 06:22:13 GMT",
    "status": "OK",
    "statusCode": 200
  },
  "body": [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
}
```

**Note:** The actual response includes a `header` object with metadata and a `body` array containing the years. Access the years via `response.body`.

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/years
```

---

#### `GET /api/year/{year}/makes`

Get all vehicle makes for a specific year.

**Path Parameters:**
- `year` (integer, required): Vehicle model year (e.g., 2024)

**Response:**
```json
{
  "header": {
    "messages": [],
    "date": "Wed, 19 Nov 2025 06:22:19 GMT",
    "status": "OK",
    "statusCode": 200
  },
  "body": [
    {
      "makeId": 2,
      "makeName": "Porsche"
    },
    {
      "makeId": 3,
      "makeName": "Hyundai"
    },
    {
      "makeId": 7,
      "makeName": "Fiat"
    },
    {
      "makeId": 11,
      "makeName": "Land Rover"
    },
    {
      "makeId": 13,
      "makeName": "Subaru"
    },
    {
      "makeId": 20,
      "makeName": "Jaguar"
    },
    {
      "makeId": 21,
      "makeName": "Kia"
    },
    {
      "makeId": 26,
      "makeName": "Volvo"
    },
    {
      "makeId": 30,
      "makeName": "BMW"
    },
    {
      "makeId": 31,
      "makeName": "Toyota"
    }
  ]
}
```

**Note:** The response includes a `header` object and a `body` array containing make objects with `makeId` and `makeName` properties. Access makes via `response.body`.

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/year/2024/makes
```

---

#### `GET /api/year/{year}/make/{make}/models`

Get all vehicle models for a specific make and year.

**Path Parameters:**
- `year` (integer, required): Vehicle model year
- `make` (string, required): Vehicle make (e.g., "BMW")

**Response:**
```json
{
  "header": {
    "messages": [],
    "date": "Wed, 19 Nov 2025 18:18:53 GMT",
    "status": "OK",
    "statusCode": 200
  },
  "body": {
    "contentSource": "MOTOR",
    "models": [
      {
        "model": "228i Gran Coupe Base",
        "id": "249901",
        "engines": [
          {
            "id": "249901:11366",
            "name": "2.0L L4 (B46A20B) Turbocharged GAS Electronic"
          }
        ]
      },
      {
        "model": "330i Base",
        "id": "240531",
        "engines": [
          {
            "id": "240531:14983",
            "name": "2.0L L4 (B46B20O0) Turbocharged GAS Electronic"
          }
        ]
      },
      {
        "model": "M3 Competition",
        "id": "241152",
        "engines": [
          {
            "id": "241152:13900",
            "name": "3.0L L6 (S58B30T0) Turbocharged GAS Electronic"
          }
        ]
      },
      {
        "model": "X5 xDrive40i",
        "id": "243227",
        "engines": [
          {
            "id": "243227:15593",
            "name": "3.0L L6 (B58B30M0) Turbocharged MILD HYBRID EV-GAS (MHEV) Electronic"
          }
        ]
      }
    ]
  }
}
```

**Note:** 
- The response includes a `header` object and a `body` object containing `contentSource` and a `models` array
- Each model has:
  - `model` (string): Model name including trim level
  - `id` (string): **Vehicle identifier** - this is the primary vehicle ID used in subsequent API calls
  - `engines` (array): Available engines for this model
    - `id` (string): Engine-specific vehicle ID (format: `{vehicleId}:{engineId}`)
    - `name` (string): Engine description with displacement, configuration, and fuel type
- Access models via `response.body.models`
- The `id` field is the vehicle identifier used in documentation, parts, and other vehicle-specific endpoints
- For vehicles with multiple engines, you may need to select a specific `engines[].id` for engine-specific content

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/year/2024/make/BMW/models
```

---

#### `POST /api/source/{contentSource}/vehicles`

Get detailed information for multiple vehicles.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier (`Motor`, `AllData`, `Mitchell`, `Identifix`)

**Request Body:**
```json
{
  "vehicleIds": ["12345", "67890"]
}
```

**Response:**
```json
[
  {
    "id": "12345",
    "name": "2024 Toyota Camry",
    "year": 2024,
    "make": "Toyota",
    "model": "Camry"
  }
]
```

**Example:**
```bash
curl -X POST https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicles \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["12345"]}'
```

---

#### `GET /api/source/{contentSource}/{vehicleId}/motorvehicles`

Get motor vehicle details including engine and submodel information.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response:**
```json
{
  "data": [
    {
      "id": "67890",
      "model": "Camry LE",
      "engines": [
        {
          "id": "engine-123",
          "name": "2.5L 4-Cylinder"
        }
      ]
    }
  ]
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/12345/motorvehicles
```

---

#### `GET /api/source/{contentSource}/{vehicleId}/name`

Get the display name for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response:**
```json
{
  "data": "2024 Toyota Camry"
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/12345/name
```

---

### Search

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/articles/v2`

Search for articles matching a vehicle and optional search term.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Query Parameters:**
- `searchTerm` (string, optional): Search term to filter articles
- `motorVehicleId` (string, optional): Motor vehicle ID for engine/submodel filtering

**Response:**
```json
{
  "articleDetails": [
    {
      "id": "article-123",
      "title": "Brake Pad Replacement",
      "description": "Step-by-step guide for replacing brake pads",
      "category": "Brakes"
    }
  ],
  "filterTabs": [
    {
      "id": "tab-1",
      "name": "All",
      "type": "All",
      "count": 150
    }
  ],
  "vehicleGeoBlockingDetails": {
    "isBlocked": false,
    "reason": null
  }
}
```

**Example:**
```bash
curl "https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/articles/v2?searchTerm=brake%20pad&motorVehicleId=67890"
```

---

### Articles & Assets

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}`

Get the full HTML content of an article.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier
- `articleId` (string, required): Article identifier

**Response:**
HTML content (text/html)

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/article/article-123
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/title`

Get the title of an article.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier
- `articleId` (string, required): Article identifier

**Response:**
```json
{
  "data": "Brake Pad Replacement"
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/article/article-123/title
```

---

#### `GET /api/source/{contentSource}/xml/{articleId}`

Get the raw XML content of an article.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `articleId` (string, required): Article identifier

**Response:**
XML content (application/xml)

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/xml/article-123
```

---

#### `GET /api/source/{contentSource}/graphic/{id}`

Get a graphic or image asset.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `id` (string, required): Graphic/image identifier

**Response:**
Binary image data (image/jpeg, image/png, image/svg+xml, etc.)

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/graphic/graphic-123 \
  --output image.jpg
```

**Note:** The proxy automatically detects image requests and handles binary data correctly.

---

### Parts

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/parts`

Get all parts associated with a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Query Parameters:**
- `motorVehicleId` (string, optional): Motor vehicle ID for engine/submodel filtering

**Response:**
```json
[
  {
    "id": "part-123",
    "partNumber": "12345-67890",
    "description": "Brake Pad Set",
    "quantity": 2
  }
]
```

**Example:**
```bash
curl "https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/parts?motorVehicleId=67890"
```

---

### Diagnostics (DTCs)

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/dtcs`

Get Diagnostic Trouble Codes available for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier (e.g., `MOTOR`, `Honda`)
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 2145,
    "dtcs": [
      {
        "id": "DTC:301467705",
        "code": "B0001:11",
        "description": "Driver Frontal Stage 1 Deployment Control: Circuit Short to Ground",
        "subtitle": "",
        "bucket": "Diagnostic Trouble Codes"
      },
      {
        "id": "DTC:301040196",
        "code": "B0001:12",
        "description": "Driver Frontal Stage 1 Deployment Control: Circuit Short to Battery",
        "subtitle": "",
        "bucket": "Diagnostic Trouble Codes"
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/dtcs
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/dtc/{dtcCode}`

Get detailed information for a specific DTC code.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier
- `dtcCode` (string, required): The DTC code (e.g., `P0300`)

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/dtc/P0300
```

---

### Technical Service Bulletins (TSBs)

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/tsbs`

Get Technical Service Bulletins for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 89,
    "tsbs": [
      {
        "id": "TSB:468775993",
        "bulletinNumber": "09-034/25",
        "title": "WATER FOUND IN TRUNK AFTER HEAVY RAIN OR CAR WASH",
        "subtitle": "",
        "releaseDate": "Aug 20, 2025"
      },
      {
        "id": "TSB:463746565",
        "bulletinNumber": "09-012/25",
        "title": "SUNVISOR(S) DO NOT STAY IN FULLY RETRACTED POSITION",
        "subtitle": "",
        "releaseDate": "Aug 1, 2025"
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/tsbs
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/tsb/{tsbId}`

Get detailed information for a specific TSB.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier
- `tsbId` (string, required): TSB identifier

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/tsb/TSB:468775993
```

---

### Wiring Diagrams

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/wiring`

Get wiring diagrams for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 56,
    "allDiagramsTotal": 634,
    "wiringDiagrams": [
      {
        "id": "WIR:536228788",
        "bucket": "Wiring Diagrams",
        "title": "ABS",
        "subtitle": "",
        "thumbnailHref": "api/source/MOTOR/graphic/12121061?w=240&h=220",
        "sort": 0
      },
      {
        "id": "WIR:537147988",
        "bucket": "Wiring Diagrams",
        "title": "Adaptive Front Lighting System",
        "subtitle": "WITH AUTOMATIC HEADLAMP LEVELING",
        "thumbnailHref": "api/source/MOTOR/graphic/12121108?w=240&h=220",
        "sort": 0
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/wiring
```

---

### Component Locations

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/components`

Get component locations for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 578,
    "componentLocations": [
      {
        "id": "CMPLOC:527860909",
        "bucket": "Component Location Diagrams",
        "title": "A Pillar Trim Panel",
        "subtitle": "",
        "thumbnailHref": "api/source/MOTOR/graphic/10505554?w=240&h=220",
        "sort": 0
      },
      {
        "id": "CMPLOC:527836125",
        "bucket": "Component Location Diagrams",
        "title": "ABS Control Module",
        "subtitle": "",
        "thumbnailHref": "api/source/MOTOR/graphic/10505523?w=240&h=220",
        "sort": 0
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/components
```

---

### Procedures

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/procedures`

Get repair procedures for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 186,
    "procedures": [
      {
        "id": "P:546844136",
        "bucket": "Interior Panel Replacement Procedures",
        "title": "A Pillar Trim Panel R&R",
        "subtitle": "",
        "sort": 0,
        "parentBucket": "Procedures"
      },
      {
        "id": "P:538499065",
        "bucket": "Starter & Alternator Replacement Procedures",
        "title": "Alternator R&R",
        "subtitle": "With Variable Engine Displacement",
        "sort": 0,
        "parentBucket": "Procedures"
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/procedures
```

---

### Diagrams (All Types)

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/diagrams`

Get all diagrams for a vehicle (component locations, wiring diagrams, etc.).

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 634,
    "diagrams": [
      {
        "id": "CMPLOC:527860909",
        "bucket": "Component Location Diagrams",
        "title": "A Pillar Trim Panel",
        "subtitle": "",
        "thumbnailHref": "api/source/MOTOR/graphic/10505554?w=240&h=220",
        "sort": 0
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/diagrams
```

---

### Specifications

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/specs`

Get specifications for a vehicle (torque specs, capacities, etc.).

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 45,
    "specs": [
      {
        "id": "F:237320787-F:237313052...",
        "bucket": "Specifications",
        "title": "Air Conditioning Specifications",
        "sort": 0
      },
      {
        "id": "SPEC:566679878",
        "bucket": "Specifications",
        "title": "Air Intake Specifications",
        "sort": 0
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/specs
```

---

### Categories

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/categories`

Get a summary of all available content categories and counts for a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "categories": [
      { "name": "All", "count": 3426 },
      { "name": "Procedures", "count": 186 },
      { "name": "Diagrams", "count": 634 },
      { "name": "Service Bulletins", "count": 89 },
      { "name": "Diagnostic Codes", "count": 2145 },
      { "name": "Maint. Schedules", "count": 1 },
      { "name": "Specs", "count": 45 },
      { "name": "Other", "count": 326 }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/categories
```

---

### Labor Operations

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/labor/{articleId}`

Get detailed labor operation information for an article.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier
- `articleId` (string, required): Article identifier

**Response:**
```json
{
  "mainOperation": {
    "id": "labor-123",
    "description": "Replace Brake Pads",
    "laborTime": 1.5
  }
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/labor/article-123
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/labor-times`

Get estimated labor times for all operations on a vehicle.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response (Real Example - 2021 Mazda 3):**
```json
{
  "header": {
    "status": "OK",
    "statusCode": 200,
    "date": "Sat, 29 Nov 2025 12:00:00 GMT"
  },
  "body": {
    "total": 186,
    "note": "Labor times are associated with individual procedures. Use /labor/{articleId} to get labor time for a specific article.",
    "laborOperations": [
      {
        "id": "P:546844136",
        "title": "A Pillar Trim Panel R&R",
        "bucket": "Interior Panel Replacement Procedures"
      }
    ]
  }
}
```

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/188569%3A13820/labor-times
```

---

### Specifications & Fluids

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/specifications`

Get vehicle specifications (torque specs, capacities, etc.).

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532:15296/specifications
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/fluids`

Get fluid specifications and capacities.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Example:**
```bash
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532:15296/fluids
```

---

### Maintenance Schedules

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/frequency`

Get maintenance schedules organized by frequency.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response:**
```json
{
  "data": [
    {
      "frequency": "Every 5,000 miles",
      "schedules": [...]
    }
  ]
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/maintenanceSchedules/frequency
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/intervals`

Get maintenance schedules organized by interval type.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response:**
```json
{
  "data": {
    "time": [...],
    "mileage": [...]
  }
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/maintenanceSchedules/intervals
```

---

#### `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/indicators`

Get maintenance indicators and their associated schedules.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier

**Response:**
```json
{
  "data": [
    {
      "indicator": "Oil Change",
      "schedules": [...]
    }
  ]
}
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/maintenanceSchedules/indicators
```

---

### Bookmarks

#### `POST /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/bookmark`

Save a bookmark for an article.

**Path Parameters:**
- `contentSource` (string, required): Content source identifier
- `vehicleId` (string, required): Vehicle identifier
- `articleId` (string, required): Article identifier

**Response:**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X POST https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/article/article-123/bookmark
```

---

### Track Change

#### `GET /api/source/track-change/processingquarters`

Get available processing quarters for track change reports.

**Response:**
```json
["2024-Q1", "2024-Q2", "2023-Q4", ...]
```

**Example:**
```bash
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/track-change/processingquarters
```

---

#### `GET /api/source/track-change/deltareport`

Get a delta report showing changes for a vehicle.

**Query Parameters:**
- `vehicleId` (string, required): Vehicle identifier
- `processingQuarter` (string, required): Processing quarter (e.g., "2024-Q1")

**Response:**
```json
{
  "vehicleId": "12345",
  "processingQuarter": "2024-Q1",
  "changes": [...]
}
```

**Example:**
```bash
curl "https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/track-change/deltareport?vehicleId=12345&processingQuarter=2024-Q1"
```

---

## Error Handling

The API uses standard HTTP status codes:

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication failed (should not occur with automatic auth)
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

**Error Response Format:**
```json
{
  "header": {
    "messages": [
      {
        "code": "500.0000001",
        "shortDescription": "Unhandled Exception",
        "longDescription": "An unhandled exception has occurred",
        "type": "Error"
      }
    ],
    "date": "Wed, 19 Nov 2025 06:22:29 GMT",
    "status": "Internal Server Error",
    "statusCode": 500
  }
}
```

**Real Example Error Response (tested 2025-11-19):**
```json
{
  "header": {
    "messages": [
      {
        "code": "500.0000001",
        "shortDescription": "Unhandled Exception",
        "longDescription": "An unhandled exception has occurred",
        "type": "Error"
      }
    ],
    "date": "Wed, 19 Nov 2025 06:22:29 GMT",
    "status": "Internal Server Error",
    "statusCode": 500
  }
}
```

**Note:** Error responses follow the same structure as successful responses, with a `header` object containing error information. Check `header.statusCode` and `header.messages` for error details.

---

## Rate Limiting

Currently, there are no explicit rate limits enforced. However, the following considerations apply:

- **Session Management**: All requests share a single authentication session
- **Concurrent Requests**: Multiple requests can be processed simultaneously
- **Timeout**: Requests timeout after 30 seconds
- **Best Practice**: Implement client-side rate limiting to avoid overwhelming the service

---

## Examples

### Complete Vehicle Selection Flow (Year/Make/Model)

```bash
# 1. Get available years
curl https://autolib.web.app/api/motor-proxy/api/years

# 2. Get makes for 2024
curl https://autolib.web.app/api/motor-proxy/api/year/2024/makes

# 3. Get models for 2024 BMW
curl https://autolib.web.app/api/motor-proxy/api/year/2024/make/BMW/models

# 4. Get vehicle name
curl https://autolib.web.app/api/motor-proxy/api/source/MOTOR/240532:15296/name
```

### Complete Vehicle Flow (VIN-based)

```bash
# 1. Decode VIN to get vehicle info
curl https://autolib.web.app/api/motor-proxy/api/vin/1HGCV1F34JA012345/vehicle

# Response: { "body": { "vehicleId": "2018:ACCORD", "contentSource": "Honda" } }

# 2. Get vehicle name
curl https://autolib.web.app/api/motor-proxy/api/source/Honda/2018:ACCORD/name

# 3. Get articles
curl "https://autolib.web.app/api/motor-proxy/api/source/Honda/vehicle/2018:ACCORD/articles/v2"

# 4. Get parts
curl "https://autolib.web.app/api/motor-proxy/api/source/Honda/vehicle/2018:ACCORD/parts"
```

### Search and Retrieve Article

```bash
# 1. Search for articles
curl "https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/articles/v2?searchTerm=brake"

# 2. Get article content
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/vehicle/12345/article/article-123

# 3. Get article image
curl https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api/source/Motor/graphic/graphic-123 \
  --output diagram.jpg
```

### JavaScript/TypeScript Example

```typescript
const BASE_URL = 'https://autolib.web.app/api/motor-proxy';

// Decode VIN
async function decodeVin(vin: string) {
  const response = await fetch(`${BASE_URL}/api/vin/${vin}/vehicle`);
  const data = await response.json();
  return data.body; // { vehicleId, contentSource, motorVehicleId }
}

// Get years
async function getYears() {
  const response = await fetch(`${BASE_URL}/api/years`);
  const data = await response.json();
  return data.body;
}

// Get vehicle name
async function getVehicleName(contentSource: string, vehicleId: string) {
  const response = await fetch(`${BASE_URL}/api/source/${contentSource}/${vehicleId}/name`);
  const data = await response.json();
  return data.body; // "2024 BMW 230i Base 2.0L L4..."
}

// Search articles
async function searchArticles(contentSource: string, vehicleId: string, searchTerm: string) {
  const url = `${BASE_URL}/api/source/${contentSource}/vehicle/${vehicleId}/articles/v2?searchTerm=${encodeURIComponent(searchTerm)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.body;
}

// Get parts
async function getParts(contentSource: string, vehicleId: string) {
  const response = await fetch(`${BASE_URL}/api/source/${contentSource}/vehicle/${vehicleId}/parts`);
  const data = await response.json();
  return data.body;
}

// Get DTCs
async function getDtcs(contentSource: string, vehicleId: string) {
  const response = await fetch(`${BASE_URL}/api/source/${contentSource}/vehicle/${vehicleId}/dtcs`);
  const data = await response.json();
  return data.body;
}
```

### Python Example

```python
import requests

BASE_URL = 'https://autolib.web.app/api/motor-proxy'

# Decode VIN
def decode_vin(vin):
    response = requests.get(f'{BASE_URL}/api/vin/{vin}/vehicle')
    return response.json()['body']

# Get years
def get_years():
    response = requests.get(f'{BASE_URL}/api/years')
    return response.json()['body']

# Get vehicle name
def get_vehicle_name(content_source, vehicle_id):
    response = requests.get(f'{BASE_URL}/api/source/{content_source}/{vehicle_id}/name')
    return response.json()['body']

# Search articles
def search_articles(content_source, vehicle_id, search_term=''):
    url = f'{BASE_URL}/api/source/{content_source}/vehicle/{vehicle_id}/articles/v2'
    params = {'searchTerm': search_term}
    response = requests.get(url, params=params)
    return response.json()['body']

# Get parts with prices
def get_parts(content_source, vehicle_id):
    url = f'{BASE_URL}/api/source/{content_source}/vehicle/{vehicle_id}/parts'
    response = requests.get(url)
    return response.json()['body']

# Get DTCs
def get_dtcs(content_source, vehicle_id):
    url = f'{BASE_URL}/api/source/{content_source}/vehicle/{vehicle_id}/dtcs'
    response = requests.get(url)
    return response.json()['body']
```

---

## OpenAPI Schema

A complete OpenAPI 3.0 schema is available in `API_SCHEMA.yaml`. You can use this schema with tools like:

- **Swagger UI**: Visual API documentation
- **Postman**: Import for API testing
- **OpenAPI Generator**: Generate client SDKs
- **API Gateway**: Configure API routing

**View the schema:**
```bash
cat API_SCHEMA.yaml
```

**Use with Swagger UI:**
1. Visit https://editor.swagger.io/
2. File → Import File → Select `API_SCHEMA.yaml`
3. View interactive API documentation

---

## Additional Resources

- **Frontend Application**: https://studio-534897447-7a1e7.web.app
- **GitHub Repository**: https://github.com/lucronn/cruis-api
- **Firebase Console**: https://console.firebase.google.com/

---

## Support

For issues or questions:
1. Check the health endpoint: `GET /health`
2. Review server logs in Firebase Console
3. Open an issue on GitHub

---

**Last Updated:** November 28, 2025  
**API Version:** 2.0.0

## Authentication Architecture

The proxy uses a multi-layer authentication approach:

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Your App       │────>│  autolib.web.app│────>│ sites.motor.com  │
│   (Frontend)     │     │    (Proxy)      │     │    (Motor M1)    │
└──────────────────┘     └─────────────────┘     └──────────────────┘
         │                       │                       │
    No auth needed         Cookie Auth            HMAC-SHA256
                          (automatic)            (server-side)
```

**Key Points:**
- No authentication required from your frontend
- Proxy handles all authentication automatically via Playwright
- Sessions are cached and renewed as needed
- All requests use shared session for efficiency

For technical details on the HMAC authentication, see `HMAC_AUTH_ANALYSIS.md`.

