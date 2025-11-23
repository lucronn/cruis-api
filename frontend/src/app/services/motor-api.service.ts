import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface VehicleModel {
    id: string;
    model: string;
    engines?: VehicleEngine[];
}

export interface VehicleEngine {
    id: string;
    name: string;
}

export interface VehicleModelsResponse {
    body: {
        contentSource: string;
        models: VehicleModel[];
    };
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

export interface ArticlesResponse {
    body: {
        articleDetails: any[];
        filterTabs: any[];
        vehicleGeoBlockingDetails?: any;
    };
}

export interface PartsResponse {
    body: any[];
}

@Injectable({
    providedIn: 'root'
})
export class MotorApiService {
    private baseUrl = '/api/motor-proxy';

    constructor(private http: HttpClient) { }

    getYears(): Observable<YearsResponse> {
        return this.http.get<YearsResponse>(`${this.baseUrl}/api/years`);
    }

    getMakes(year: number): Observable<MakesResponse> {
        return this.http.get<MakesResponse>(`${this.baseUrl}/api/year/${year}/makes`);
    }

    getModels(year: number, make: string): Observable<VehicleModelsResponse> {
        return this.http.get<VehicleModelsResponse>(
            `${this.baseUrl}/api/year/${year}/make/${make}/models`
        );
    }

    getVehicleName(contentSource: string, vehicleId: string): Observable<{ body: string }> {
        return this.http.get<{ body: string }>(
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
}
