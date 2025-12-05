# Implementation Plan - Fix Data Mapping and Unified Items

## Problem
1.  **Incorrect Data Path**: `loadSpecs`, `loadProcedures`, and `loadDiagrams` are trying to access data properties (e.g., `specs`) directly on the response object, but the API returns them nested under `body` (e.g., `response.body.specs`).
2.  **Incomplete Refactor**: `loadSpecs` is still populating `this.articles` and `this.filteredArticles` instead of the new `this.items` array used by the unified template.

## Proposed Changes

### `frontend/src/app/docs/docs.component.ts`

1.  **Update `loadSpecs`**:
    *   Access `response.body.specs`.
    *   Map the data to `this.items` using the `UnifiedItem` interface.
    *   Set `type: 'article'`.

2.  **Update `loadProcedures`**:
    *   Access `response.body.procedures`.
    *   Ensure mapping to `this.items` is correct.

3.  **Update `loadDiagrams`**:
    *   Access `response.body.diagrams`.
    *   Ensure mapping to `this.items` is correct.

4.  **Check other loaders**: Briefly verify `loadBrakeService`, `loadAcHeater`, etc., if they exist and are used, to ensure they follow the same pattern.

## Verification
*   Deploy changes.
*   Verify "Specs" tab loads data correctly.
*   Verify "Procedures" tab loads data correctly.
*   Verify "Diagrams" tab loads data correctly.
