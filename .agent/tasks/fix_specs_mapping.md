# Task: Fix Data Mapping for Specs and Generic Loaders

## Context
The user reported that the "Specs" section displays an empty state despite the network inspector showing a successful API response with data. The API response structure is nested within a `body` property (e.g., `response.body.specs`), but the current frontend code attempts to access `specs` directly on the response object.

## Objective
Fix the data mapping in `DocsComponent` for `loadSpecs` and other generic data loading methods to correctly access the nested data structures returned by the API.

## Steps
1.  **Analyze `loadSpecs`**: Confirm the incorrect property access in `docs.component.ts`.
2.  **Analyze Other Loaders**: Check `loadProcedures`, `loadDiagrams`, `loadBrakeService`, etc., for similar mapping errors.
3.  **Implement Fix**: Update the `map` logic in these methods to access `response.body.X` (e.g., `response.body.specs`, `response.body.procedures`).
4.  **Verify**: Use the browser subagent (if possible) or careful code review to ensure the mapping matches the known API structure.

## API Response Structure (Confirmed)
```json
{
    "header": { ... },
    "body": {
        "total": 46,
        "specs": [ ... ] // or "procedures", "diagrams", etc.
    }
}
```
