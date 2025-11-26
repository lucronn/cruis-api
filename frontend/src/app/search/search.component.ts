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

    advancedMode = false;
    groupedResults: { category: string, articles: any[], expanded: boolean }[] = [];

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

    toggleAdvancedMode() {
        // advancedMode is already updated by ngModel
        if (this.advancedMode) {
            this.searchTerm = ''; // Clear search term for advanced mode (show all)
            this.search();
        } else {
            this.results = [];
            this.groupedResults = [];
            this.searched = false;
        }
    }

    search() {
        if (!this.advancedMode && !this.searchTerm.trim()) {
            return;
        }

        if (!this.vehicleId) {
            alert('Please select a vehicle first');
            this.router.navigate(['/vehicles']);
            return;
        }

        this.loading = true;
        this.searched = true;
        this.groupedResults = [];

        // If advanced mode, search with empty string to get all
        const term = this.advancedMode ? '' : this.searchTerm;

        this.motorApi.getArticles(this.contentSource, this.vehicleId, term)
            .pipe(
                catchError(err => {
                    console.error('Error searching:', err);
                    return of({ body: { articleDetails: [], filterTabs: [] } });
                })
            )
            .subscribe(response => {
                this.results = response.body?.articleDetails || [];
                this.processResults();
                this.loading = false;
            });
    }

    processResults() {
        const map = new Map<string, any[]>();

        this.results.forEach(article => {
            const category = article.parentBucket || article.bucket || 'Other';
            if (!map.has(category)) {
                map.set(category, []);
            }
            map.get(category)!.push(article);
        });

        this.groupedResults = Array.from(map.entries())
            .map(([category, articles]) => ({
                category,
                articles,
                expanded: false // Default to collapsed
            }))
            .sort((a, b) => a.category.localeCompare(b.category));
    }

    toggleCategory(group: any) {
        group.expanded = !group.expanded;
    }

    viewArticle(article: any) {
        this.router.navigate(['/docs'], {
            queryParams: {
                vehicleId: this.vehicleId,
                articleId: article.id,
                contentSource: this.contentSource
            }
        });
    }

    clearSearch() {
        this.searchTerm = '';
        this.results = [];
        this.groupedResults = [];
        this.searched = false;
        if (this.advancedMode) {
            this.search(); // Refresh all if in advanced mode
        }
    }
}
