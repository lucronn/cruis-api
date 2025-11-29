// Generated API Models - Aligned with OpenAPI Specification

// ============================================================
// Core Enums
// ============================================================

export enum ContentSource {
    Motor = 'MOTOR',
    ProDemand = 'ProDemand',
    AllData = 'AllData'
}

export enum FilterTabType {
    All = 'All',
    Procedures = 'Procedures',
    Diagrams = 'Diagrams',
    TSBs = 'TSBs',
    DTCs = 'DTCs',
    Specifications = 'Specifications'
}

// ============================================================
// Article & Content Models
// ============================================================

export interface ArticleDetails {
    id: string;
    title?: string;
    subtitle?: string;
    code?: string;
    description?: string;
    bucket?: string;
    parentBucket?: string;
    bulletinNumber?: string;
    releaseDate?: string;
    thumbnailHref?: string;
    sort?: number;
    expanded?: boolean;
}

export interface Bucket {
    name: string;
    nameOverride?: string | null;
    sort?: number;
    children?: Bucket[];
}

export interface FilterTab {
    name: string;
    count?: number;
    type?: string;
    filterTabType?: FilterTabType;
    buckets?: Bucket[];
    articleTrailId?: string;
    isCountUnknown?: boolean;
    articlesCount?: number | null;
}

// ============================================================
// Vehicle Models
// ============================================================

export interface ModelAndVehicleId {
    id: string;
    model: string;
    engines?: VehicleEngine[];
}

export interface VehicleEngine {
    id: string;
    name: string;
    displacement?: string;
    cylinders?: number;
    fuelType?: string;
}

export interface VehicleModel {
    id: string;
    model: string;
    engines?: VehicleEngine[];
}

export interface MotorVehicle {
    id: string;
    motorVehicleId: string;
    year: number;
    make: string;
    model: string;
    submodel?: string;
    engines?: VehicleEngine[];
}

// ============================================================
// Response Models
// ============================================================

export interface ApiResponse<T> {
    header: {
        status: string;
        statusCode: number;
        date?: string;
        messages?: any[];
    };
    body: T;
}

export interface VehicleResponse {
    body: {
        contentSource: string;
        models: VehicleModel[];
    };
}

export interface VehicleNameResponse {
    body: string;
}

export interface YearsResponse {
    body: number[];
}

export interface MakesResponse {
    body: Array<{
        makeId: number;
        makeName: string;
    }>;
}

export interface ModelsResponse {
    body: {
        contentSource: string;
        models: VehicleModel[];
    };
}

export interface MotorVehiclesResponse {
    body: MotorVehicle[];
}

export interface VehicleGeoBlockingDetails {
    isBlocked?: boolean;
    reason?: string;
    message?: string;
}

// ============================================================
// Articles & Search
// ============================================================

export interface ArticlesResponse {
    body: {
        articleDetails: ArticleDetails[];
        filterTabs: FilterTab[];
        vehicleGeoBlockingDetails?: VehicleGeoBlockingDetails;
    };
}

export interface CategoriesResponse {
    body: {
        categories: Array<{
            name: string;
            count: number;
        }>;
    };
}

// ============================================================
// Diagnostics
// ============================================================

export interface DtcDetails {
    id: string;
    code: string;
    description: string;
    bucket?: string;
}

export interface DtcsResponse {
    body: {
        total: number;
        dtcs: DtcDetails[];
    };
}

// ============================================================
// Service Bulletins
// ============================================================

export interface TsbDetails {
    id: string;
    bulletinNumber: string;
    title: string;
    releaseDate?: string;
}

export interface TsbsResponse {
    body: {
        total: number;
        tsbs: TsbDetails[];
    };
}

// ============================================================
// Diagrams
// ============================================================

export interface DiagramDetails {
    id: string;
    bucket: string;
    title: string;
    subtitle?: string;
    thumbnailHref?: string;
}

export interface WiringDiagramsResponse {
    body: {
        total: number;
        allDiagramsTotal?: number;
        wiringDiagrams: DiagramDetails[];
    };
}

export interface ComponentsResponse {
    body: {
        total: number;
        componentLocations: DiagramDetails[];
    };
}

export interface DiagramsResponse {
    body: {
        total: number;
        diagrams: DiagramDetails[];
    };
}

// ============================================================
// Procedures & Specifications
// ============================================================

export interface ProcedureDetails {
    id: string;
    bucket: string;
    title: string;
    subtitle?: string;
    parentBucket?: string;
}

export interface ProceduresResponse {
    body: {
        total: number;
        procedures: ProcedureDetails[];
    };
}

export interface SpecsResponse {
    body: {
        total: number;
        specs: any[];
    };
}

// ============================================================
// VIN Decode
// ============================================================

export interface VinDecodeResponse {
    header: {
        status: string;
        statusCode: number;
        date?: string;
        messages?: any[];
    };
    body: {
        vehicleId: string;
        contentSource: string;
        motorVehicleId?: string;
        vehicleIdChoices?: string;
    };
}

// ============================================================
// Health & Credentials
// ============================================================

export interface HealthResponse {
    status: string;
    authenticated: boolean;
    sessionId?: string;
    expiresAt?: string;
    timestamp: string;
}

export interface CredentialsResponse {
    publicKey: string;
    apiTokenKey: string;
    apiTokenValue: string;
    expiration: string;
    userName: string;
    subscriptions: string[];
    tokenAuthHeader: string;
}

// ============================================================
// Feedback
// ============================================================

export interface Feedback {
    articleId?: string;
    rating?: number;
    comment?: string;
    timestamp?: string;
}
