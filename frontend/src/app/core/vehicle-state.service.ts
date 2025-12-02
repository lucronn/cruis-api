import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CurrentVehicle {
    year: number;
    make: string;
    model: string;
    engine?: string;
    vehicleId: string;
    vehicleName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VehicleStateService {
    private currentVehicleSubject = new BehaviorSubject<CurrentVehicle | null>(null);
    currentVehicle$ = this.currentVehicleSubject.asObservable();

    constructor() {
        // Try to load from local storage on init
        const saved = localStorage.getItem('currentVehicle');
        if (saved) {
            try {
                this.currentVehicleSubject.next(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved vehicle', e);
            }
        }
    }

    setVehicle(vehicle: CurrentVehicle) {
        this.currentVehicleSubject.next(vehicle);
        localStorage.setItem('currentVehicle', JSON.stringify(vehicle));
    }

    clearVehicle() {
        this.currentVehicleSubject.next(null);
        localStorage.removeItem('currentVehicle');
    }

    getCurrentVehicle(): CurrentVehicle | null {
        return this.currentVehicleSubject.value;
    }
}
