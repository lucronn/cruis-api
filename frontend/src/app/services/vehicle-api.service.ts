import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Vehicle {
    year: number;
    make: string;
    model: string;
    vehicleId: string;
}

export interface VehicleYears {
    years: number[];
}

export interface VehicleMakes {
    makes: Array<{ makeName: string }>;
}

export interface VehicleModels {
    models: Array<{ model: string; id: string; engines?: any[] }>;
    contentSource: string;
}

@Injectable({
    providedIn: 'root'
})
export class VehicleApiService {
    private baseUrl = '/api'; // Will use proxy

    constructor(private http: HttpClient) { }

    getYears(): Observable<number[]> {
        return this.http.get<number[]>(`${this.baseUrl}/years`);
    }

    getMakes(year: number): Observable<VehicleMakes> {
        const params = new HttpParams().set('year', year.toString());
        return this.http.get<VehicleMakes>(`${this.baseUrl}/makes`, { params });
    }

    getModels(year: number, make: string): Observable<VehicleModels> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('make', make);
        return this.http.get<VehicleModels>(`${this.baseUrl}/models`, { params });
    }

    getVehicleByVin(vin: string): Observable<any> {
        const params = new HttpParams().set('vin', vin);
        return this.http.get(`${this.baseUrl}/vehicle-by-vin`, { params });
    }
}
