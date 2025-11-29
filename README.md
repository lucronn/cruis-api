# AutoLib - Motor.com API Proxy

Automotive repair information API proxy providing access to Motor.com data through a clean, authenticated interface.

## 🏗️ Project Structure

```
/
├── backend/          # Backend services
│   ├── proxy/       # Motor API proxy (Firebase Functions)
│   └── functions/    # Additional Firebase functions
├── frontend/        # Angular frontend application
├── docs/            # Documentation
├── scripts/         # Deployment and utility scripts
├── data/            # Data files (HAR, swagger, schemas)
├── archive/         # Backups and archived code
└── config/          # Configuration files
```

## 🚀 Quick Start

### Backend (Proxy Service)

```bash
cd backend/proxy
npm install
firebase deploy --only functions
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

## 📚 Documentation

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API usage guide
- **[OpenAPI Spec](openapi.yaml)** - Full API specification (55 endpoints)
- **[HMAC Auth Analysis](docs/HMAC_AUTH_ANALYSIS.md)** - Authentication details

## 🔗 API Endpoints

**Base URL:** `https://autolib.web.app/api/motor-proxy`

See [openapi.yaml](openapi.yaml) for complete API specification with 55 endpoints including:
- Vehicle selection (VIN, Year/Make/Model)
- Diagnostic Trouble Codes (DTCs)
- Technical Service Bulletins (TSBs)
- Wiring Diagrams & Component Locations
- Repair Procedures & Specifications
- Parts with OEM pricing
- Maintenance Schedules

## 🔐 Authentication

Authentication is handled automatically by the backend proxy. No client-side authentication required.

## 📝 License

MIT
