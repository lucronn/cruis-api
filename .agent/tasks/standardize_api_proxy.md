# Task: Standardize API Proxy Responses

## Context
The user suggested modifying the backend API proxy to return a consistent data structure across all endpoints. This would simplify the frontend code by removing the need for endpoint-specific data mapping logic. Currently, the frontend has to handle various response shapes (e.g., `response.body.specs`, `response.body.procedures`, `response.body.dtcs`).

## Objective
Refactor the backend proxy (`backend/proxy/index.js` or similar) to normalize responses from the upstream Motor API into a standard format before sending them to the frontend.

## Proposed Standard Format
```json
{
  "data": [ ... ], // The array of items (articles, dtcs, etc.)
  "meta": { ... }  // Any metadata (total count, etc.)
}
```

## Steps
1.  **Analyze Backend Proxy**: Examine `backend/proxy/index.js` (or relevant file) to identify where upstream responses are handled.
2.  **Implement Normalization**: Create a helper function in the backend to normalize responses.
    *   If upstream returns `{ specs: [...] }`, map it to `{ data: [...] }`.
    *   If upstream returns `{ procedures: [...] }`, map it to `{ data: [...] }`.
    *   Do this for all supported endpoints (Articles, DTCs, TSBs, Wiring, Labor, Maintenance, Specs, etc.).
3.  **Update Frontend**: Once the backend is standardized, update `DocsComponent` to always expect `response.data` (or similar) and map it to `UnifiedItem`.
4.  **Deploy & Verify**: Deploy both backend and frontend and verify all tabs still work.

## specific Endpoints to Normalize
*   `/articles/v2` -> `articles`
*   `/dtcs` -> `dtcs`
*   `/tsbs` -> `tsbs`
*   `/wiring` -> `diagrams` (or `wiring`)
*   `/labor` -> `details` (or `labor`)
*   `/maintenance` -> `intervals`, `indicators` (might need special handling or just return both in `data`)
*   `/specs` -> `specs`
*   `/procedures` -> `procedures`
*   `/content/libraries/estimate/...` (Brake, Battery, etc.) -> `articles` or `procedures`

## Note
This is a significant architectural improvement that aligns with the user's request for a "modular approach".
