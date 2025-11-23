import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MotorApiService } from '../services/motor-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface RecentVehicle {
    id: number;
    vehicleId?: string;
    vehicleName?: string;
    year?: string;
    make?: string;
    model?: string;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    recentVehicles: RecentVehicle[] = [];
    availableYearsCount = 0;
    loading = true;

    constructor(
        private router: Router,
        private motorApi: MotorApiService
    ) { }

    ngOnInit() {
        this.loadRecentVehicles();
        this.loadStats();
    }

    loadRecentVehicles() {
        const stored = sessionStorage.getItem('selectedVehicles');
        if (stored) {
            try {
                const vehicles = JSON.parse(stored) as RecentVehicle[];
                this.recentVehicles = vehicles.slice(0, 5); // Show last 5
            } catch (e) {
                console.error('Error parsing recent vehicles:', e);
            }
        }
    }

    loadStats() {
        this.motorApi.getYears()
            .pipe(
                catchError(err => {
                    console.error('Error loading years:', err);
                    return of({ body: [] });
                })
            )
            .subscribe(response => {
                this.availableYearsCount = response.body?.length || 0;
                this.loading = false;
            });
    }

    navigateToVehicle(vehicle: RecentVehicle) {
        if (vehicle.vehicleId) {
            this.router.navigate(['/docs'], {
                queryParams: {
                    vehicleId: vehicle.vehicleId,
                    contentSource: 'Motor'
                }
            });
        }
    }
}
