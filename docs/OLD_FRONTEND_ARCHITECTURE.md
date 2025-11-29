# Old Frontend Architecture & Features Documentation

**Purpose:** Comprehensive guide to the old frontend implementation to assist in developing the new frontend.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [Routing & Navigation](#routing--navigation)
4. [Core Features](#core-features)
5. [API Integration](#api-integration)
6. [Component Architecture](#component-architecture)
7. [User Settings & Configuration](#user-settings--configuration)
8. [Special Features](#special-features)

---

## Architecture Overview

### Technology Stack

- **Framework:** Angular (with TypeScript)
- **State Management:** Akita (reactive state management)
- **Routing:** Angular Router with query parameter-based navigation
- **HTTP Client:** Angular HttpClient with generated API services
- **UI Libraries:** 
  - NgBootstrap (accordions, popovers)
  - NgSelect (dropdowns)
  - NgxExtendedPdfViewer (PDF viewing)
  - LazyLoadImageModule (image lazy loading)

### Project Structure

```
src/app/
├── core/                    # Core application components
│   ├── components/          # Reusable UI components
│   ├── state/               # Layout state management
│   └── user-settings/       # User settings service
├── assets/                  # Asset state management
├── search/                  # Search functionality
├── vehicle-selection/       # Vehicle selection (YMME/VIN)
├── maintenance-schedules/    # Maintenance schedule features
├── delta-report/            # Track change/delta reports
├── labor-operation/         # Labor operation details
├── generated/               # Auto-generated API services
└── shared/                  # Shared UI components
```

---

## State Management

### Akita Pattern

The application uses **Akita** for state management with the following pattern:

1. **Store** - Holds state
2. **Query** - Reads state (observables)
3. **Facade** - Public API for components (combines store + query + API calls)

### Key State Stores

#### 1. Vehicle Selection Store (`VehicleSelectionStore`)
- **Purpose:** Manages selected vehicle(s)
- **State:**
  - `vehicles: ModelAndVehicleId[]` - List of selected vehicles
  - `loading: boolean` - Loading state
- **Facade:** `VehicleSelectionFacade`
- **Key Observables:**
  - `contentSource$` - Current content source (MOTOR, Toyota, Honda, etc.)
  - `activeVehicleId$` - Currently active vehicle ID
  - `motorVehicleId$` - Motor vehicle ID (for non-MOTOR sources)
  - `vehicleVin$` - VIN if selected via VIN lookup
  - `vehicleIdChoices$` - Multiple vehicle IDs (comma-separated)
  - `all$` - All selected vehicles
  - `loading$` - Loading state

#### 2. Search Results Store (`SearchResultsStore`)
- **Purpose:** Manages article search results
- **State:**
  - `entities: ArticleDetails[]` - Search results
  - `activeId: string | null` - Currently active article ID
  - `loading: boolean`
- **Facade:** `SearchResultsFacade`
- **Key Observables:**
  - `all$` - All search results
  - `active$` - Active article
  - `activeId$` - Active article ID
  - `allCount$` - Total count
  - `bucketsFilledWithArticles$` - Articles grouped by bucket
  - `filterTabsAndTheirFullBuckets$` - Filter tabs with buckets
  - `searchTerm$` - Current search term

#### 3. Filter Tabs Store (`FilterTabsStore`)
- **Purpose:** Manages filter tabs (All, Procedures, Diagrams, Specs, DTC, Bulletins)
- **State:**
  - `filterTabs: FilterTab[]` - Available filter tabs
  - `active: string | null` - Active filter tab
- **Facade:** `SearchResultsFacade` (combined with search)

#### 4. Assets Store (`RootAssetsStore`, `LeafAssetsStore`)
- **Purpose:** Manages article HTML content
- **State:**
  - `html: string | undefined` - Article HTML
  - `base64Pdf: string | undefined` - PDF content
  - `documentId: string | undefined`
  - `publishedDate: Date | undefined`
  - `createdDate: Date | undefined`
  - `isOutdated: boolean` - Bookmark outdated flag
  - `contentSilos: string[]` - Content silos
  - `sourceSilos: string[]` - Source silos
  - `loading: boolean`
  - `error: any`
- **Facade:** `AssetsFacade`
- **Key Observables:**
  - `rootHtml$` - Root article HTML
  - `leafHtml$` - Leaf (nested) article HTML
  - `activeArticleId$` - Currently active article ID
  - `articleIds$` - Article ID trail (breadcrumb)
  - `hasBreadcrumb$` - Whether breadcrumb exists
  - `rootLoading$`, `leafLoading$` - Loading states

#### 5. Labor Store (`LaborStore`)
- **Purpose:** Manages labor operation details
- **State:**
  - `mainOperation: Labor` - Main labor operation
  - `loading: boolean`
  - `error: any`
- **Facade:** `AssetsFacade`

#### 6. Vehicle Parts Store (`VehiclePartsStore`)
- **Purpose:** Manages parts for selected vehicle
- **State:**
  - `entities: PartLineItem[]` - Parts list
- **Facade:** `AssetsFacade`
- **Key Observable:**
  - `vehicleParts$` - All parts for vehicle

#### 7. Maintenance Schedules Stores
- **Purpose:** Manages maintenance schedule data
- **Stores:**
  - `MaintenanceSchedulesByIntervalStore` - Interval-based schedules
  - `MaintenanceSchedulesByIndicatorStore` - Indicator-based schedules
- **Facade:** `MaintenanceSchedulesFacade`
- **Key Observables:**
  - `maintenanceSchedulesByInterval$` - Interval schedules
  - `maintenanceSchedulesByIndicator$` - Indicator schedules
  - `maintenanceSchedulesByFrequency$` - Frequency schedules (F/N/R)

#### 8. Layout Store (`LayoutStore`)
- **Purpose:** Manages UI layout state
- **Facade:** `LayoutFacade`
- **Key Observable:**
  - `isMobileMenuOpen$` - Mobile menu state

---

## Routing & Navigation

### Route Structure

```typescript
Routes = [
  {
    path: '',
    component: ModernLayoutComponent,
    canActivate: [APIUserLogoutGuard],
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
      { path: 'vehicles', component: VehicleDashboardComponent },
      { path: 'docs/:filterTab', component: ModernDocsComponent }
    ]
  },
  {
    path: 'delta-report',
    component: DeltaReportComponent,
    canActivate: [DeltaReportGuard]
  },
  { path: '**', component: ErrorComponent }
]
```

### Query Parameters

All navigation state is stored in **URL query parameters**:

```typescript
enum QueryStringParameters {
  vehicleIdChoices = 'vehicleIdChoices',    // Comma-separated vehicle IDs
  year = 'year',                             // Year selection
  make = 'make',                             // Make selection
  model = 'model',                           // Model selection
  engine = 'engine',                         // Engine selection
  contentSource = 'contentSource',          // MOTOR, Toyota, Honda, etc.
  vehicleId = 'vehicleId',                   // Primary vehicle ID
  vin = 'vin',                               // VIN if selected via VIN
  motorVehicleId = 'motorVehicleId',         // Motor vehicle ID (for non-MOTOR)
  articleIdTrail = 'articleIdTrail',        // Comma-separated article IDs (breadcrumb)
  bookmarkId = 'bookmarkId',                // Bookmark ID
  searchTerm = 'searchTerm'                  // Search term
}
```

### Path Parameters

```typescript
enum PathParameters {
  filterTab = 'filterTab',    // Filter tab (all, procedures, diagrams, etc.)
  articleId = 'articleId'     // Article ID (rarely used)
}
```

### Navigation Pattern

**Key Pattern:** Navigation uses `router.navigate()` with query parameter merging:

```typescript
this.router.navigate([], {
  queryParams: {
    [QueryStringParameters.vehicleId]: vehicleId,
    [QueryStringParameters.contentSource]: contentSource
  },
  queryParamsHandling: 'merge'  // Preserves other params
});
```

**Article Navigation:** Uses `articleIdTrail` for breadcrumb navigation:
- Single article: `articleIdTrail=12345`
- Nested article: `articleIdTrail=12345,67890` (root, then leaf)

---

## Core Features

### 1. Vehicle Selection

#### Year/Make/Model/Engine (YMME) Selection

**Component:** `YearMakeModelComponent`

**Flow:**
1. User selects **Year** → Updates `year` query param
2. System fetches **Makes** for that year → `GET /api/year/{year}/makes`
3. User selects **Make** → Updates `make` query param
4. System fetches **Models** for year/make → `GET /api/year/{year}/make/{make}/models`
5. User selects **Model** → May show engine selection if multiple engines
6. User selects **Engine** (if applicable) → Navigates to docs

**Key Methods:**
- `setYear(year)` - Sets year, clears make
- `setMake(make)` - Sets make
- `setModel(model)` - Sets model, handles engine selection
- `setEngine(engine)` - Sets engine, navigates to docs

**API Calls:**
- `GET /api/years` - Get all years
- `GET /api/year/{year}/makes` - Get makes for year
- `GET /api/year/{year}/make/{make}/models` - Get models for year/make
- `GET /api/source/{contentSource}/{vehicleId}/motorvehicles` - Get motor vehicle details (engines)

#### VIN Search

**Component:** `YearMakeModelComponent` (same component)

**Flow:**
1. User enters VIN (17 characters)
2. System calls `GET /api/vin/{vin}/vehicle`
3. Response contains:
   - `vehicleId` - Primary vehicle ID
   - `vehicleIdChoices` - Multiple vehicle IDs (if applicable)
   - `motorVehicleId` - Motor vehicle ID
   - `contentSource` - Content source
4. System navigates to docs with all parameters

**Key Method:**
- `findVehicleWithVIN(vin)` - Validates VIN, calls API, handles errors

**Error Handling:**
- Invalid VIN (not found) → Shows error message
- Unauthorized VIN → Shows authorization error
- Network error → Handled by error handler

#### Recent Vehicles

**Storage:** `sessionStorage` key `selectedVehicles`

**Structure:**
```typescript
interface SelectedVehicle {
  id: number;              // Timestamp
  vehicleName?: string;
  contentSource?: ContentSource;
  vehicleId?: string;
  vin?: string;
  motorVehicleId?: string;
}
```

**Methods:**
- `addVehicleSelectionToSessionStorage()` - Adds vehicle to session storage
- `getSelectedVehicles()` - Retrieves recent vehicles (max 10 by default)

**Navigation:**
- `navigateToVehicle(vehicle)` - Navigates to vehicle using stored params

### 2. Search & Article Discovery

#### Search Functionality

**Component:** `SearchFormComponent`, `SearchResultsPanelComponent`

**Flow:**
1. User enters search term
2. System updates `searchTerm` query param
3. `SearchResultsFacade` automatically triggers search when:
   - `contentSource` changes
   - `vehicleId` changes
   - `searchTerm` changes
   - `motorVehicleId` changes
4. API call: `GET /api/source/{contentSource}/vehicle/{vehicleId}/articles/v2?searchTerm={term}&motorVehicleId={id}`
5. Results are grouped by **buckets** (Procedures, Diagrams, Specs, DTC, TSB, etc.)
6. Results are filtered by **filter tabs** (All, Procedures, Diagrams, etc.)

**Key Observables:**
- `searchTerm$` - Current search term (from query params)
- `all$` - All search results
- `filterTabsAndTheirFullBuckets$` - Filter tabs with articles grouped by bucket
- `bucketsFilledWithArticles$` - Articles organized by bucket

**Filter Tabs:**
- **All** - Shows all articles
- **Procedures** - Filter: `bucket === 'Procedures'`
- **Diagrams** - Filter: `bucket === 'Diagrams'`
- **Specs** - Filter: `bucket === 'Specifications'`
- **DTC** - Filter: `bucket === 'Diagnostic Trouble Codes'`
- **Bulletins** - Filter: `bucket === 'Technical Service Bulletins'`

#### Article Selection

**Flow:**
1. User clicks article in search results
2. System updates `articleIdTrail` query param with article ID
3. `AssetsFacade` detects change and fetches article HTML
4. Article is displayed in modal or main content area

**Key Method:**
- `activateArticle(doc: ArticleDetails)` - Updates query params with article ID

### 3. Article Display

#### Article Modal

**Component:** `ArticleModalComponent`

**Features:**
- Displays article HTML content
- Breadcrumb navigation (article trail)
- Close button (X)
- ESC key closes modal (if X button visible)
- Mobile detection for responsive behavior

**Breadcrumb:**
- Shows article titles from `articleIdTrail`
- Each breadcrumb item links to that point in trail
- Uses `getArticleTitle()` API for each ID in trail

#### Dynamic HTML Rendering

**Component:** `DynamicArticleHtmlComponent`

**Features:**
- Renders HTML from API
- Converts custom tags to standard HTML:
  - `<mtr-doc-link>` → `<a>` with navigation
  - `<mtr-image-link>` → `<span>` with hover image
  - `<mtr-image>` → `<img>`
  - `<mtr-area>` → `<area>` (image map)
- Handles internal links (scroll to element)
- Supports full HTML pages vs. fragments

**HTML Processing:**
1. Receives HTML from API
2. Replaces custom tags with standard HTML
3. Calculates navigation attributes for links
4. Renders in component

**Internal Links:**
- Elements with class `internal-link` are converted to anchors
- Clicking scrolls to target element with smooth scroll
- Visual feedback (highlight) on scroll

#### Article Toolbox

**Component:** `ArticleToolboxComponent`

**Features:**
- **Print** - Prints article (with/without images)
- **Bookmark** - Saves article bookmark
- **Special print modes:**
  - SVG printing (splits large SVGs into pages)
  - PDF printing
  - Hide images option
  - Content source-specific print styles

**Print Functionality:**
- `print(hideImages)` - Main print method
- Handles iframe content
- Handles SVG content (converts to PNG, splits large images)
- Handles HTML content
- Adds Toyota license message if applicable
- Removes print elements after printing

**Bookmark Functionality:**
- `bookmark()` - Creates bookmark via API
- `POST /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/bookmark`
- Returns bookmark ID
- Integrates with CCC system (`window.external.execute`)

### 4. Maintenance Schedules

**Component:** `MaintenanceSchedulesComponent`

**Features:**
- Filter by **Interval** (Miles, Kilometers, Months) or **Indicator**
- Filter by **Severity** (Normal, Severe)
- Display schedules grouped by **Frequency** (F=First, N=Normal, R=Repeat)
- Expand/collapse accordions
- Print functionality

**Flow:**
1. User selects filter type (Interval or Indicator)
2. User enters interval value (if interval filter)
3. User selects severity
4. System calls multiple APIs:
   - `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/intervals?intervalType={type}&interval={value}&severity={severity}`
   - `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/indicators?severity={severity}`
   - `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/frequency?frequencyTypeCode={F|N|R}&severity={severity}`
5. Results displayed in accordions

**State Management:**
- `MaintenanceSchedulesByIntervalStore` - Interval schedules
- `MaintenanceSchedulesByIndicatorStore` - Indicator schedules
- `MaintenanceSchedulesFacade` - Combines all data

### 5. Delta Report (Track Changes)

**Component:** `DeltaReportComponent`

**Features:**
- View vehicle changes by quarter
- Filter/search vehicles
- Compare quarters
- Navigate to vehicle from report

**Flow:**
1. System fetches available quarters: `GET /api/source/track-change/processingquarters`
2. User selects quarter
3. System fetches delta report: `GET /api/source/track-change/deltareport?quarter={quarter}`
4. User can filter/search results
5. User can compare quarters (opens modal)
6. User can navigate to vehicle

**API Calls:**
- `GET /api/source/track-change/processingquarters` - Get quarters
- `GET /api/source/track-change/deltareport?quarter={quarter}` - Get report

### 6. Labor Operations

**Component:** `LaborOperationComponent`

**Features:**
- Display labor operation details
- Add/remove parts
- Print labor details

**Flow:**
1. Article ID starts with `L:` (e.g., `L:12345`)
2. System calls: `GET /api/source/{contentSource}/vehicle/{vehicleId}/labor/{articleId}?motorVehicleId={id}&searchTerm={term}`
3. Displays labor operation with parts
4. User can add parts from vehicle parts list
5. User can remove parts
6. User can print

**Parts Integration:**
- Vehicle parts loaded automatically: `GET /api/source/{contentSource}/vehicle/{vehicleId}/parts?motorVehicleId={id}`
- Parts searchable by description or part number
- Selected parts added to labor operation

---

## API Integration

### Generated API Services

All API services are **auto-generated** from OpenAPI spec:

**Location:** `src/app/generated/api/services/`

**Key Services:**
- `VehicleApi` - Vehicle selection, VIN lookup
- `SearchApi` - Article search
- `AssetApi` - Article content, graphics, labor
- `PartsApi` - Parts lookup
- `BookmarkApi` - Bookmark management
- `TrackChangeApi` - Delta reports
- `UiApi` - User settings

### API Configuration

**Base URL:** Set in `ApiModule.forRoot({ rootUrl: '.' })`

**Interceptor:** `ProxyAuthInterceptor` - Adds authentication headers

### Key API Endpoints Used

#### Vehicle Selection
- `GET /api/years` - Get all years
- `GET /api/year/{year}/makes` - Get makes
- `GET /api/year/{year}/make/{make}/models` - Get models
- `GET /api/vin/{vin}/vehicle` - VIN lookup
- `GET /api/source/{contentSource}/vehicles` - Get vehicles by IDs
- `GET /api/source/{contentSource}/{vehicleId}/motorvehicles` - Get motor vehicle details
- `GET /api/source/{contentSource}/{vehicleId}/name` - Get vehicle name

#### Search & Articles
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/articles/v2?searchTerm={term}&motorVehicleId={id}` - Search articles
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}?motorVehicleId={id}&bucketName={bucket}&articleSubtype={subtype}&searchTerm={term}` - Get article HTML
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/title` - Get article title
- `GET /api/source/{contentSource}/xml/{articleId}` - Get article XML

#### Graphics
- `GET /api/source/{contentSource}/graphic/{id}` - Get graphic (image/SVG)
- `GET /api/manufacturer/{manufacturerId}/graphic/{id}` - Get manufacturer graphic
- `GET /api/asset/{handleId}` - Get asset by handle

#### Parts
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/parts?motorVehicleId={id}&searchTerm={term}` - Get parts

#### Labor
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/labor/{articleId}?motorVehicleId={id}&searchTerm={term}` - Get labor details

#### Maintenance Schedules
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/intervals?intervalType={type}&interval={value}&severity={severity}` - Get by interval
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/indicators?severity={severity}` - Get by indicator
- `GET /api/source/{contentSource}/vehicle/{vehicleId}/maintenanceSchedules/frequency?frequencyTypeCode={F|N|R}&severity={severity}` - Get by frequency

#### Track Changes
- `GET /api/source/track-change/processingquarters` - Get quarters
- `GET /api/source/track-change/deltareport?quarter={quarter}` - Get report

#### Bookmarks
- `POST /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/bookmark` - Create bookmark
- `GET /api/bookmark/{bookmarkId}` - Get bookmark

#### UI Settings
- `GET /api/ui/usersettings` - Get user settings

---

## Component Architecture

### Layout Components

#### ModernLayoutComponent
- Main layout wrapper
- Header with navigation
- Search overlay
- Vehicle selector overlay
- Sidebar (mobile)
- Content area

#### VehicleDashboardComponent
- Landing page after vehicle selection
- Shows vehicle info
- Recent documents (mock)
- Popular articles (mock)
- Quick links

#### ModernDocsComponent
- Document viewer page
- Filter tabs
- Search results panel
- Article content area

### Core Components

#### FilterTabsComponent
- Displays filter tabs (All, Procedures, Diagrams, etc.)
- Shows counts per tab
- Handles tab switching

#### SearchResultsPanelComponent
- Displays search results
- Groups by buckets
- Collapsible buckets
- "Show all" functionality
- Thumbnail support

#### ArticleModalComponent
- Modal for article display
- Breadcrumb navigation
- Close functionality

#### DynamicArticleHtmlComponent
- Renders article HTML
- Handles custom tags
- Internal link scrolling

#### ArticleToolboxComponent
- Print functionality
- Bookmark functionality
- Content source-specific features

### Directives

#### HrefRoutingDirective
- Converts standard `<a>` tags to Angular routing
- Preserves query parameters
- Handles merge-query-params attribute

#### ZoomPanSVGDirective
- Enables zoom/pan for SVG graphics
- Touch support

#### ZoomableImagesDirective
- Enables zoom for images
- Modal viewer

### Guards

#### APIUserLogoutGuard
- Checks if API user logout is enabled
- Redirects if needed

#### DeltaReportGuard
- Checks if delta report navigation is enabled
- Redirects if needed

---

## User Settings & Configuration

### UserSettingsService

**Purpose:** Manages user-specific settings from API

**Settings:**
- `ymmeSelectorMode` - YMME selector visibility (Enabled/Disabled)
- `recentVehiclesMode` - Recent vehicles visibility
- `recentVehiclesCount` - Max recent vehicles (default: 10)
- `hamburgerMenuMode` - Mobile menu mode
- `oemLicenseAgreement` - OEM license agreement text
- `ymmeVinSearchMode` - VIN search mode
- `loginType` - Login type (MotorLogin/SharedKey)
- `isCcc` - CCC system flag
- `enableMotorVehicleModel` - Motor vehicle model selector
- `splashUrl` - Splash screen URL
- `sessionExpiryRedirectUrl` - Session expiry redirect
- `apiUserLogoutMode` - API user logout mode
- `apiUserLogoutLabel` - Logout button label
- `apiUserLogoutURL` - Logout redirect URL
- `feedbackMode` - Feedback mode
- `feedbackLabel` - Feedback button label
- `userId` - User ID
- `lhNavigationDefaultMode` - Left-hand navigation default (Collapsed/Expanded)
- `printEnableHeader` - Print header enabled
- `printBannerUrl` - Print banner URL
- `printBannerColor` - Print banner color
- `printDisplayVehicleDetails` - Show vehicle details in print
- `lhNavigationSiloDisplayMode` - Silo display mode (Show/Hide)
- `navigateToVehicleDeltaReport` - Delta report navigation enabled

**Storage:**
- Primary: Cookie `UIUserSettings` (JSON)
- Fallback: API call to `/api/ui/usersettings`

**Usage:**
```typescript
constructor(public userSettings: UserSettingsService) {}

// Observable
this.userSettings.ymmeSelectorMode$.subscribe(mode => {
  // Use mode
});

// One-time value
this.userSettings.ymmeSelectorMode$.pipe(take(1)).subscribe(mode => {
  // Use mode
});
```

---

## Special Features

### 1. Content Source Handling

**Content Sources:**
- `MOTOR` - Motor.com content
- `Toyota` - Toyota-specific content
- `Honda` - Honda-specific content
- `Nissan` - Nissan-specific content
- `Stellantis` - Stellantis content
- `ToyotaDelta` - Toyota delta report content

**Content Source-Specific Behavior:**
- **Toyota:** Shows license message, special print handling
- **Honda:** Special print styles
- **Nissan:** Image rotation handling
- **Stellantis:** Special image handling

### 2. Motor Vehicle ID

**Purpose:** For non-MOTOR content sources, a `motorVehicleId` is required for many API calls.

**Flow:**
1. User selects vehicle (YMME or VIN)
2. If content source is not MOTOR, system fetches motor vehicle details
3. If only one motor vehicle, automatically sets `motorVehicleId` query param
4. If multiple, user must select

**Usage:**
- Required for: Articles, Parts, Labor, Maintenance Schedules
- Optional for: Vehicle selection, VIN lookup

### 3. Article ID Trail (Breadcrumb)

**Purpose:** Enables nested article navigation (drill-down).

**Format:** Comma-separated article IDs
- Single: `articleIdTrail=12345`
- Nested: `articleIdTrail=12345,67890` (root, then leaf)

**Behavior:**
- First ID = root article (displayed in main area)
- Last ID = active/leaf article (displayed in modal or nested area)
- Clicking breadcrumb item navigates to that point in trail

### 4. Bookmark System

**Purpose:** Save articles for later access.

**Flow:**
1. User clicks bookmark button
2. System calls `POST /api/source/{contentSource}/vehicle/{vehicleId}/article/{articleId}/bookmark`
3. Returns bookmark ID
4. Bookmark can be accessed via `bookmarkId` query param
5. System fetches bookmark: `GET /api/bookmark/{bookmarkId}`
6. Displays article with "outdated" flag if article changed

**Integration:**
- CCC system integration via `window.external.execute`
- Bookmark ID stored in query params

### 5. Geo-Blocking

**Feature:** Some vehicles may be geo-blocked.

**Handling:**
- `VehicleGeoBlockingDetails` returned in search results
- `GeoBlockingModalComponent` displays blocking message
- User cannot access content if blocked

### 6. Print Functionality

**Features:**
- Print with/without images
- SVG splitting for large graphics
- Content source-specific print styles
- Toyota license message
- Print header/banner support
- Vehicle details in print

**Print Modes:**
- **Default:** Standard HTML print
- **Hide Images:** Removes images from print
- **SVG:** Converts SVG to PNG, splits large images
- **PDF:** Uses base64 PDF if available

### 7. Error Handling

**Global Error Handler:** `GlobalErrorHandler`

**Features:**
- Catches all unhandled errors
- Logs errors
- Displays user-friendly messages
- Prevents app crashes

**Error Display:**
- `ErrorComponent` for 404 and other errors
- Inline error messages in components
- Toast notifications (if implemented)

### 8. Mobile Support

**Features:**
- Responsive design
- Mobile menu (hamburger)
- Touch gestures (zoom/pan)
- Mobile-specific layouts
- Mobile search drawer

**Detection:**
- `detectMobile()` utility function
- CSS media queries
- Component-level mobile detection

### 9. Loading States

**Pattern:** All stores have `loading$` observables

**Usage:**
```typescript
this.facade.loading$.subscribe(loading => {
  if (loading) {
    // Show spinner
  } else {
    // Hide spinner
  }
});
```

**Components:**
- `HorizontalCirclesLoaderComponent` - Loading spinner

### 10. URL State Persistence

**Key Feature:** All state is in URL query parameters

**Benefits:**
- Shareable URLs
- Browser back/forward works
- Bookmarkable states
- Deep linking

**Pattern:**
- Never store state in component variables
- Always read from query params via `RouterQuery`
- Always update via `router.navigate()` with query params

---

## Key Patterns & Best Practices

### 1. Reactive Programming

**Pattern:** Use RxJS observables for all async operations

```typescript
// Good
this.data$ = combineLatest([
  this.source1$,
  this.source2$
]).pipe(
  switchMap(([s1, s2]) => this.api.getData(s1, s2)),
  map(response => response.body),
  catchError(error => {
    this.errorHandler.handleError(error);
    return EMPTY;
  })
);
```

### 2. State Management

**Pattern:** Use facades, never access stores directly

```typescript
// Good
constructor(public facade: MyFacade) {}

// Bad
constructor(private store: MyStore) {}
```

### 3. Query Parameters

**Pattern:** Always use query parameters for state

```typescript
// Good
this.router.navigate([], {
  queryParams: { vehicleId: id },
  queryParamsHandling: 'merge'
});

// Bad
this.selectedVehicleId = id; // Component variable
```

### 4. Error Handling

**Pattern:** Always handle errors in API calls

```typescript
this.api.getData().pipe(
  catchError(error => {
    this.errorHandler.handleError(error);
    return EMPTY;
  })
).subscribe();
```

### 5. Loading States

**Pattern:** Use store loading states

```typescript
this.facade.loading$.subscribe(loading => {
  // Handle loading
});
```

### 6. Change Detection

**Pattern:** Use `OnPush` change detection strategy

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 7. Component Lifecycle

**Pattern:** Unsubscribe in `ngOnDestroy`

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.data$.pipe(
    takeUntil(this.destroy$)
  ).subscribe();
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## Migration Notes

### Key Differences to Consider for New Frontend

1. **State Management:** Old uses Akita, new may use different approach
2. **Routing:** Old uses query params heavily, new may use different pattern
3. **API Services:** Old uses generated services, new may use different approach
4. **Component Structure:** Old has many small components, new may consolidate
5. **Styling:** Old uses SCSS with BEM-like patterns, new may use different approach

### Critical Features to Preserve

1. **URL State Persistence** - All state in URL
2. **Article Navigation** - Breadcrumb trail system
3. **Search Functionality** - Real-time search with filtering
4. **Print Functionality** - Complex print handling
5. **Mobile Support** - Responsive design
6. **Error Handling** - Graceful error handling
7. **Loading States** - Clear loading indicators

---

## Appendix: File Reference

### Key Files

- `app-routing.module.ts` - Routing configuration
- `app.module.ts` - Module configuration
- `url-parameters.ts` - Query/path parameter constants
- `utilities.ts` - Utility functions
- `core/proxy-auth.interceptor.ts` - HTTP interceptor
- `core/user-settings/user-settings.service.ts` - User settings
- `vehicle-selection/state/state/vehicle-selection.facade.ts` - Vehicle selection
- `search/state/search-results.facade.ts` - Search functionality
- `assets/state/assets.facade.ts` - Article content
- `maintenance-schedules/state/maintenance-schedules.facade.ts` - Maintenance schedules

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29  
**Author:** Auto-generated from codebase analysis

