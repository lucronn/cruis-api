# Backend Services

This directory contains all backend services for the AutoLib project.

## Structure

- **`proxy/`** - Motor.com API proxy service (Firebase Functions)
  - Handles authentication via Playwright
  - Proxies requests to sites.motor.com/m1
  - Provides 55+ API endpoints

- **`functions/`** - Additional Firebase Functions (if any)

## Proxy Service

The proxy service is located in `proxy/` and provides:
- Automatic authentication to Motor.com via EBSCO library card
- Cookie-based session management
- Full API coverage of Motor.com m1 endpoints

See `proxy/package.json` for dependencies and `proxy/index.js` for implementation.

## Deployment

```bash
cd proxy
npm install
firebase deploy --only functions
```
