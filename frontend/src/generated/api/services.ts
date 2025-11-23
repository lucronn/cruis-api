import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContentSource, VehicleResponse, VehicleNameResponse } from './models';

@Injectable({
    providedIn: 'root'
})
export class VehicleApi {
    private baseUrl = '/api/motor-proxy';

    constructor(private http: HttpClient) { }

    getMotorModels(params: { year: number; make: string }): Observable<VehicleResponse> {
        const httpParams = new HttpParams()
            .set('year', params.year.toString())
            .set('make', params.make);

        return this.http.get<VehicleResponse>(`${this.baseUrl}/models`, { params: httpParams });
    }

    getMotorVehicleDetails(params: { contentSource: ContentSource; vehicleId: string }): Observable<VehicleResponse> {
        const httpParams = new HttpParams()
            .set('contentSource', params.contentSource)
            .set('vehicleId', params.vehicleId);

        return this.http.get<VehicleResponse>(`${this.baseUrl}/vehicle-details`, { params: httpParams });
    }

    getVehicles(params: { contentSource: ContentSource; body: { vehicleIds: string[] } }): Observable<VehicleResponse> {
        return this.http.post<VehicleResponse>(
            `${this.baseUrl}/vehicles?contentSource=${params.contentSource}`,
            params.body
        );
    }

    getVehicleName(params: { contentSource: ContentSource; vehicleId: string }): Observable<VehicleNameResponse> {
        const httpParams = new HttpParams()
            .set('contentSource', params.contentSource)
            .set('vehicleId', params.vehicleId);

        return this.http.get<VehicleNameResponse>(`${this.baseUrl}/vehicle-name`, { params: httpParams });
    }
}
