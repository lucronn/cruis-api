import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MotorApiService } from '../services/motor-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent {
    searchTerm: string = '';
    vehicleId: string = '';
    contentSource: string = 'MOTOR';

    results: any[] = [];
    loading = false;
    searched = false;

    constructor(
        private router: Router,
        private motorApi: MotorApiService
    ) {
        // Try to get vehicleId from session storage
        const stored = sessionStorage.getItem('selectedVehicles');
        if (stored) {
            try {
                const vehicles = JSON.parse(stored);
                if (vehicles.length > 0) {
                    this.vehicleId = vehicles[0].vehicleId;
                }
            } catch (e) {
                console.error('Error parsing vehicles');
            }
        }
    }

    search() {
        if (!this.searchTerm.trim()) {
            return;
        }

        if (!this.vehicleId) {
            alert('Please select a vehicle first');
            this.router.navigate(['/vehicles']);
            return;
        }

        this.loading = true;
        this.searched = true;

        this.motorApi.getArticles(this.contentSource, this.vehicleId, this.searchTerm)
            .pipe(
                catchError(err => {
                    console.error('Error searching:', err);
                    return of({ body: { articleDetails: [], filterTabs: [] } });
                })
            )
            .subscribe(response => {
                this.results = response.body?.articleDetails || [];
                this.loading = false;
            });
    }

    clearSearch() {
        this.searchTerm = '';
        this.results = [];
        this.searched = false;
    }
}
