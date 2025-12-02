import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    ArticlesResponse,
    YearsResponse,
    MakesResponse,
    ModelsResponse,
    VehicleNameResponse,
    DtcsResponse,
    TsbsResponse,
    WiringDiagramsResponse,
    ComponentsResponse,
    ProceduresResponse,
    SpecsResponse,
    VinDecodeResponse,
    MotorVehiclesResponse
} from '~/generated/api/models';

export interface PartsResponse {
    body: any[];
}

@Injectable({
    providedIn: 'root'
})
export class MotorApiService {
    private baseUrl = '/api/motor-proxy';

    constructor(private http: HttpClient) { }

    /**
     * Get all available model years
     */
    getYears(): Observable<YearsResponse> {
        return this.http.get<YearsResponse>(`${this.baseUrl}/api/years`);
    }

    getMakes(year: number): Observable<MakesResponse> {
        return this.http.get<MakesResponse>(`${this.baseUrl}/api/year/${year}/makes`);
    }

    getModels(year: number, make: string): Observable<ModelsResponse> {
        return this.http.get<ModelsResponse>(
            `${this.baseUrl}/api/year/${year}/make/${make}/models`
        );
    }

    getVehicleName(contentSource: string, vehicleId: string): Observable<VehicleNameResponse> {
        return this.http.get<VehicleNameResponse>(
            `${this.baseUrl}/api/source/${contentSource}/${encodeURIComponent(vehicleId)}/name`
        );
    }

    getArticles(contentSource: string, vehicleId: string, searchTerm: string = ''): Observable<ArticlesResponse> {
        const params = new HttpParams().set('searchTerm', searchTerm);
        return this.http.get<ArticlesResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/articles/v2`,
            { params }
        );
    }

    getParts(contentSource: string, vehicleId: string): Observable<PartsResponse> {
        return this.http.get<PartsResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/parts`
        );
    }

    getArticleContent(contentSource: string, vehicleId: string, articleId: string): Observable<any> {
        // Determine endpoint based on article ID prefix
        // L: -> Labor
        // Default -> Article
        const endpointType = articleId.startsWith('L:') ? 'labor' : 'article';

        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/${endpointType}/${encodeURIComponent(articleId)}`
        ).pipe(
            map(response => response.body)
        );
    }

    getMaintenanceSchedulesByInterval(contentSource: string, vehicleId: string, intervalType: string, interval: number, severity: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenance-schedules/by-interval?intervalType=${intervalType}&interval=${interval}&severity=${severity}`
        ).pipe(
            map(response => response.body)
        );
    }

    getMaintenanceSchedulesByFrequency(contentSource: string, vehicleId: string, frequency: string, severity: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenance-schedules/by-frequency?frequency=${frequency}&severity=${severity}`
        ).pipe(
            map(response => response.body)
        );
    }

    getMaintenanceSchedulesByIndicator(contentSource: string, vehicleId: string, severity: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenance-schedules/by-indicator?severity=${severity}`
        ).pipe(
            map(response => response.body)
        );
    }

    getSpecifications(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/specs`
        ).pipe(map(response => response.body));
    }

    /**
     * Get vehicle fluid specifications and capacities
     */
    getFluids(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/fluids`
        ).pipe(map(response => response.body));
    }

    // ============================================================
    // NEW API ENDPOINTS (Updated November 2025)
    // ============================================================

    /**
     * Decode a VIN to get vehicle details
     * Returns: { vehicleId, contentSource, motorVehicleId }
     */
    decodeVin(vin: string): Observable<VinDecodeResponse> {
        return this.http.get<VinDecodeResponse>(`${this.baseUrl}/api/vin/${vin}/vehicle`);
    }

    /**
     * Search for a vehicle by VIN with full response handling
     * Returns: { contentSource, vehicleId, motorVehicleId, year, make, model, etc. }
     */
    searchVehicleByVin(vin: string): Observable<any> {
        return this.http.get<VinDecodeResponse>(`${this.baseUrl}/api/vin/${vin}/vehicle`)
            .pipe(map(response => response.body));
    }

    /**
     * Get Diagnostic Trouble Codes (DTCs) for a vehicle
     */
    getDtcs(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<DtcsResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/dtcs`
        ).pipe(map(response => response.body));
    }

    /**
     * Get details for a specific DTC code
     */
    getDtcDetail(contentSource: string, vehicleId: string, dtcCode: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/dtc/${encodeURIComponent(dtcCode)}`
        ).pipe(map(response => response.body));
    }

    /**
     * Get Technical Service Bulletins (TSBs) for a vehicle
     */
    getTsbs(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<TsbsResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/tsbs`
        ).pipe(map(response => response.body));
    }

    /**
     * Get details for a specific TSB
     */
    getTsbDetail(contentSource: string, vehicleId: string, tsbId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/tsb/${encodeURIComponent(tsbId)}`
        ).pipe(map(response => response.body));
    }

    /**
     * Get wiring diagrams for a vehicle
     */
    getWiringDiagrams(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<WiringDiagramsResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/wiring`
        ).pipe(map(response => response.body));
    }

    /**
     * Get component locations for a vehicle
     */
    getComponentLocationsV3(contentSource: string, vehicleId: string): Observable<any> {
        const url = `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/components`;
        console.log('MotorApiService: Fetching component locations from:', url);
        return this.http.get<ComponentsResponse>(url).pipe(map(response => response.body));
    }

    /**
     * Get estimated labor times for a vehicle
     */
    getLaborTimes(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/labor-times`
        ).pipe(map(response => response.body));
    }

    // ============================================================
    // SPECIALIZED PROCEDURE ENDPOINTS (Server-side filtering)
    // These fetch pre-filtered results from backend for better performance
    // ============================================================

    /**
     * Get all repair procedures for a vehicle (server-side filtered)
     */
    getProcedures(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<ProceduresResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/procedures`
        ).pipe(map(response => response.body));
    }

    /**
     * Get all diagrams for a vehicle (server-side filtered)
     */
    getDiagrams(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/diagrams`
        ).pipe(map(response => response.body));
    }

    /**
     * Get vehicle specifications (server-side filtered)
     * Alias for getSpecifications with consistent naming
     */
    getSpecs(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<SpecsResponse>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/specs`
        ).pipe(map(response => response.body));
    }

    /**
     * Get article categories summary
     */
    getCategories(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/categories`
        ).pipe(map(response => response.body));
    }

    /**
     * Get all labor operations (server-side filtered)
     */
    getLabor(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/labor`
        ).pipe(map(response => response.body));
    }

    /**
     * Get labor detail for a specific article
     */
    getLaborDetail(contentSource: string, vehicleId: string, articleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/labor/${encodeURIComponent(articleId)}`
        ).pipe(map(response => response.body));
    }

    /**
     * Get brake service procedures (server-side filtered)
     */
    getBrakeService(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/brake-service`
        ).pipe(map(response => response.body));
    }

    /**
     * Get A/C and heater procedures (server-side filtered)
     */
    getAcHeater(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/ac-heater`
        ).pipe(map(response => response.body));
    }

    /**
     * Get TPMS procedures (server-side filtered)
     */
    getTpms(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/tpms`
        ).pipe(map(response => response.body));
    }

    /**
     * Get computer relearn procedures (server-side filtered)
     */
    getRelearn(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/relearn`
        ).pipe(map(response => response.body));
    }

    /**
     * Get maintenance lamp reset procedures (server-side filtered)
     */
    getLampReset(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/lamp-reset`
        ).pipe(map(response => response.body));
    }

    /**
     * Get battery service procedures (server-side filtered)
     */
    getBattery(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/battery`
        ).pipe(map(response => response.body));
    }

    /**
     * Get steering and suspension procedures (server-side filtered)
     */
    getSteeringSuspension(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/steering-suspension`
        ).pipe(map(response => response.body));
    }

    /**
     * Get airbag service procedures (server-side filtered)
     */
    getAirbag(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/airbag`
        ).pipe(map(response => response.body));
    }

    // ============================================================
    // ADDITIONAL DISCOVERED ENDPOINTS (November 2025)
    // ============================================================

    /**
     * Get motor vehicles (engines/submodels) for a vehicle
     */
    getMotorVehicles(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<MotorVehiclesResponse>(
            `${this.baseUrl}/api/source/${contentSource}/${encodeURIComponent(vehicleId)}/motorvehicles`
        ).pipe(map(response => response.body));
    }

    /**
     * Get article title
     */
    getArticleTitle(contentSource: string, vehicleId: string, articleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/article/${encodeURIComponent(articleId)}/title`
        ).pipe(map(response => response.body));
    }

    /**
     * Get article XML content
     */
    getArticleXml(contentSource: string, articleId: string): Observable<string> {
        return this.http.get(
            `${this.baseUrl}/api/source/${contentSource}/xml/${encodeURIComponent(articleId)}`,
            { responseType: 'text' }
        );
    }

    /**
     * Get track change processing quarters
     */
    getTrackChangeQuarters(): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/track-change/processingquarters`
        ).pipe(map(response => response.body));
    }

    /**
     * Get track change delta report
     */
    getTrackChangeDeltaReport(vehicleId: string, processingQuarter: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/track-change/deltareport`,
            { params: { vehicleId, processingQuarter } }
        ).pipe(map(response => response.body));
    }

    /**
     * Get maintenance schedules by frequency
     */
    getMaintenanceByFrequency(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenanceSchedules/frequency`
        ).pipe(map(response => response.body));
    }

    /**
     * Get maintenance schedules by indicators (dashboard lights)
     */
    getMaintenanceByIndicators(contentSource: string, vehicleId: string): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenanceSchedules/indicators`
        ).pipe(map(response => response.body));
    }

    /**
     * Get maintenance schedules by intervals
     */
    getMaintenanceByIntervals(contentSource: string, vehicleId: string, intervalType: string, interval: number): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenanceSchedules/intervals`,
            { params: { intervalType, interval: interval.toString() } }
        ).pipe(map(response => response.body));
    }

    // ============================================================
    // CYBERPUNK FEATURES (November 2025)
    // ============================================================

    /**
     * Get Part Vector Illustrations (X-Ray Mode)
     */
    getVectorIllustrations(contentSource: string, vehicleId: string, groupId: number): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/part-vectors`,
            { params: { GroupID: groupId.toString() } }
        );
    }

    /**
     * Get Maintenance Timeline (Predictive Core)
     */
    getMaintenanceTimeline(contentSource: string, vehicleId: string, mileage: number): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/maintenance-timeline/miles/${mileage}`
        ).pipe(map(res => res.body));
    }

    /**
     * Get Related Wiring Diagrams for DTC (Linked Intelligence)
     */
    getRelatedWiring(contentSource: string, vehicleId: string, dtcId: number): Observable<any> {
        return this.http.get<any>(
            `${this.baseUrl}/api/source/${contentSource}/vehicle/${encodeURIComponent(vehicleId)}/wiring/related-to/dtc/${dtcId}`
        );
    }
}
