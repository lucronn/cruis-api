# 🚗 YourCar M1 Vehicle Information System

[![Deploy to Firebase](https://github.com/lucron9090/cruis-api/actions/workflows/deploy-firebase.yml/badge.svg)](https://github.com/lucron9090/cruis-api/actions/workflows/deploy-firebase.yml)
[![CI Build](https://github.com/lucron9090/cruis-api/actions/workflows/ci.yml/badge.svg)](https://github.com/lucron9090/cruis-api/actions/workflows/ci.yml)

Modern, responsive vehicle service and maintenance information system powered by Angular and Firebase.

**🌐 Live Application:** [https://autolib.web.app](https://autolib.web.app)

## 📁 Project Structure

```
vehicleapi/
├── frontend/          # Angular application
├── motorproxy/        # Firebase Function (proxy + auth)
└── README.md         # This file
```

## 🚀 Quick Start

### Frontend (Angular App)

```bash
cd vehicleapi/frontend
npm install --legacy-peer-deps
npm start
# Runs on http://localhost:4200
```

### Backend (Firebase Function)

```bash
cd vehicleapi/motorproxy
npm install
firebase deploy --only functions
# Deploys to Firebase Cloud Functions
```

## 📡 Architecture

```
User Browser
    ↓
Firebase Hosting (autolib.web.app)
    ↓
Firebase Function (motorproxy)
    ↓
Playwright Authentication → Cookie Auth
    ↓
sites.motor.com/m1/api/* (JSON endpoints)
```

### Authentication Flow
```
EBSCO Portal → sites.motor.com → api.motor.com
                    │                   │
              Cookie Auth         HMAC-SHA256
              (automated)         (server-side)
```

See `HMAC_AUTH_ANALYSIS.md` for full authentication details.

## 📡 API Endpoints

**Base URL:** `https://autolib.web.app/api/motor-proxy`

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Check proxy status |
| `GET /credentials` | Get auth token info (debug) |
| `GET /api/vin/{vin}/vehicle` | **VIN decode** → vehicleId + contentSource |
| `GET /api/years` | Get all years |
| `GET /api/year/{year}/makes` | Get makes for year |
| `GET /api/year/{year}/make/{make}/models` | Get models |
| `GET /api/source/{cs}/{vid}/name` | Get vehicle name |
| `GET /api/source/{cs}/vehicle/{vid}/articles/v2` | Get articles |
| `GET /api/source/{cs}/vehicle/{vid}/parts` | Get OEM parts |
| `GET /api/source/{cs}/vehicle/{vid}/dtcs` | Get DTCs |
| `GET /api/source/{cs}/vehicle/{vid}/tsbs` | Get TSBs |

### Quick Test
```bash
# Decode a VIN
curl "https://autolib.web.app/api/motor-proxy/api/vin/1HGCV1F34JA012345/vehicle" | jq .

# Get parts (returns JSON with prices!)
curl "https://autolib.web.app/api/motor-proxy/api/source/MOTOR/vehicle/240532:15296/parts" | jq '.body[:3]'
```

See `API_DOCUMENTATION.md` for complete API reference.

## 🔧 Development

### Frontend
- **Location**: `frontend/`
- **Framework**: Angular 12
- **Dev Server**: `npm start`
- **Build**: `npm run build`

### Backend
- **Location**: `motorproxy/`
- **Runtime**: Node.js 22 (Firebase Functions)
- **Auth**: Playwright with EBSCO credentials
- **Deploy**: `firebase deploy --only functions`

## 🌐 Deployment

Deploy from `motorproxy/` directory:

```bash
# Deploy both frontend and backend
cd vehicleapi/motorproxy
firebase deploy

# Deploy only frontend
firebase deploy --only hosting

# Deploy only backend  
firebase deploy --only functions
```

**Live URLs:**
- **Frontend**: https://autolib.web.app
- **Backend**: https://motorproxy-erohrfg7qa-uc.a.run.app

## 🔐 Authentication

Automatic authentication using Playwright:
- Card: `1001600244772`
- Single server-side session
- Auto-reauthentication on expiration
- No client credentials exposed

## 🤖 CI/CD - Automated Deployment

### GitHub Actions Workflows

This repository includes three automated workflows:

1. **🚀 Deploy to Firebase** (`.github/workflows/deploy-firebase.yml`)
   - **Trigger:** Push to `main` or manual
   - **Actions:** Build Angular → Deploy to Firebase Hosting
   
2. **🔍 CI Build** (`.github/workflows/ci.yml`) 
   - **Trigger:** All PRs and pushes
   - **Actions:** Build validation + artifact upload
   
3. **👀 PR Preview** (`.github/workflows/pr-preview.yml`)
   - **Trigger:** Pull requests
   - **Actions:** Deploy to preview channel

### Setting up Firebase Authentication for GitHub Actions

To enable automatic Firebase deployment in GitHub Actions, you can use **either** of these methods:

#### Method 1: Firebase Service Account (Recommended - No CLI Required)

1. **Get your Firebase service account JSON:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (`studio-534897447-7a1e7`)
   - Navigate to **Project Settings** → **Service Accounts**
   - Click **Generate New Private Key**
   - Download the JSON file

2. **Add the service account to GitHub Secrets:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire JSON content from the downloaded file
   - Click **Add secret**

3. **The workflow will now automatically deploy to Firebase** when you push to `main`.

#### Method 2: Firebase CI Token (Alternative - Requires Firebase CLI)

1. **Generate a Firebase CI token:**
   ```bash
   firebase login:ci
   ```
   This will open a browser for authentication and generate a token.

2. **Add the token to GitHub Secrets:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_TOKEN`
   - Value: Paste the token from step 1
   - Click **Add secret**

3. **The workflow will now automatically deploy to Firebase** when you push to `main`.

**Note:** The deploy script supports multiple authentication modes:
- Service account JSON (via `GOOGLE_APPLICATION_CREDENTIALS`)
- CI token (via `FIREBASE_TOKEN`)
- Interactive mode (for manual deployment)

## 📝 Scripts

### Frontend (`cd vehicleapi/frontend`)
- `npm start` - Start dev server
- `npm run build` - Production build

### Backend (`cd vehicleapi/motorproxy`)
- `npm install` - Install dependencies
- `firebase deploy` - Deploy to Firebase
