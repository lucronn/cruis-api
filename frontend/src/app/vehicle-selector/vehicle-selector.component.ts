import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MotorApiService, VehicleEngine } from '../services/motor-api.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

interface VehicleOption {
    id: string;
    label: string;
    engines?: VehicleEngine[];
}

@Component({
    selector: 'app-vehicle-selector',
    templateUrl: './vehicle-selector.component.html',
    styleUrls: ['./vehicle-selector.component.scss']
})
export class VehicleSelectorComponent implements OnInit {
    searchTerm: string = '';
    loading = false;
    error: string | null = null;

    // Data cache
    years: VehicleOption[] = [];
    makes: VehicleOption[] = [];
    models: VehicleOption[] = [];

    // Search State
    parsedYear: string | null = null;
    parsedMake: VehicleOption | null = null;
    parsedModel: VehicleOption | null = null;
    selectedContentSource: string = 'MOTOR'; // Default, will be updated from API

    // Suggestions to display
    suggestions: any[] = [];
    suggestionType: 'year' | 'make' | 'model' | 'engine' | 'history' = 'history';

    private searchDebounce: any;

    constructor(
        private router: Router,
        private motorApi: MotorApiService
    ) { }

    ngOnInit() {
        this.loadYears();
        this.loadRecentVehicles();
    }

    loadYears() {
        const currentYear = new Date().getFullYear();
        const yearList = [];
        for (let year = currentYear; year >= 1990; year--) {
            yearList.push({
                id: year.toString(),
                label: year.toString()
            });
        }
        this.years = yearList;
    }

    loadRecentVehicles() {
        const stored = sessionStorage.getItem('selectedVehicles');
        if (stored) {
            try {
                const recent = JSON.parse(stored);
                if (recent.length > 0) {
                    this.suggestions = recent;
                    this.suggestionType = 'history';
                }
            } catch (e) {
                console.error('Error parsing recent vehicles');
            }
        }
    }

    onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.error = null;

        if (!this.searchTerm.trim()) {
            this.resetSearch();
            this.loadRecentVehicles();
            return;
        }

        this.searchDebounce = setTimeout(() => {
            this.processSearchTerm(this.searchTerm);
        }, 300);
    }

    async processSearchTerm(term: string) {
        const parts = term.trim().split(/\s+/);

        // 1. Detect Year (First 4 digit number)
        const yearMatch = term.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : null;

        if (year && year !== this.parsedYear) {
            this.parsedYear = year;
            // Reset downstream
            this.parsedMake = null;
            this.parsedModel = null;
            this.makes = [];
            this.models = [];

            // Load Makes for this year
            await this.fetchMakes(parseInt(year));
        } else if (!year) {
            // Still typing year?
            this.parsedYear = null;
            this.suggestions = this.years.filter(y => y.label.startsWith(term));
            this.suggestionType = 'year';
            return;
        }

        // 2. Detect Make
        if (this.parsedYear && this.makes.length > 0) {
            // Remove year from term to find make
            const termWithoutYear = term.replace(this.parsedYear, '').trim();

            if (!termWithoutYear) {
                // User typed year, show makes
                this.suggestions = this.makes;
                this.suggestionType = 'make';
                return;
            }

            // Find matching make
            const matchedMake = this.makes.find(m =>
                m.label.toLowerCase() === termWithoutYear.toLowerCase()
            );

            if (matchedMake) {
                if (this.parsedMake?.id !== matchedMake.id) {
                    this.parsedMake = matchedMake;
                    this.parsedModel = null;
                    this.models = [];
                    await this.fetchModels(parseInt(this.parsedYear), matchedMake.label);
                }
            } else {
                // Filter makes
                const filteredMakes = this.makes.filter(m =>
                    m.label.toLowerCase().includes(termWithoutYear.toLowerCase())
                );

                if (filteredMakes.length > 0) {
                    this.suggestions = filteredMakes;
                    this.suggestionType = 'make';
                    this.parsedMake = null; // Reset if they backspaced
                    return;
                }
            }
        }

        // 3. Detect Model
        if (this.parsedYear && this.parsedMake && this.models.length > 0) {
            const termWithoutYearAndMake = term
                .replace(this.parsedYear, '')
                .replace(this.parsedMake.label, '') // Case sensitive replace might fail if user typed lowercase
                .replace(new RegExp(this.parsedMake.label, 'i'), '')
                .trim();

            if (!termWithoutYearAndMake) {
                this.suggestions = this.models;
                this.suggestionType = 'model';
                return;
            }

            const filteredModels = this.models.filter(m =>
                m.label.toLowerCase().includes(termWithoutYearAndMake.toLowerCase())
            );

            this.suggestions = filteredModels;
            this.suggestionType = 'model';
        }
    }

    async fetchMakes(year: number) {
        this.loading = true;
        try {
            const response = await this.motorApi.getMakes(year).toPromise();
            if (response && response.body) {
                this.makes = response.body.map(m => ({
                    id: m.makeName,
                    label: m.makeName
                })).sort((a, b) => a.label.localeCompare(b.label));
            }
        } catch (err) {
            console.error('Error fetching makes', err);
            this.error = 'Could not fetch makes';
        } finally {
            this.loading = false;
        }
    }

    async fetchModels(year: number, make: string) {
        this.loading = true;
        try {
            const response = await this.motorApi.getModels(year, make).toPromise();
            if (response && response.body) {
                this.models = response.body.models.map(m => ({
                    id: m.id,
                    label: m.model,
                    engines: m.engines
                }));
                // Store content source if needed
                if (response.body.contentSource) {
                    this.selectedContentSource = response.body.contentSource;
                }
            }
        } catch (err) {
            console.error('Error fetching models', err);
            this.error = 'Could not fetch models';
        } finally {
            this.loading = false;
        }
    }

    selectSuggestion(item: any) {
        if (this.suggestionType === 'history') {
            // Restore from history
            this.navigateToVehicle(item.vehicleId, {
                id: item.model, // approximate
                label: item.model
            }, item.year, item.make, item.model);
            return;
        }

        if (this.suggestionType === 'year') {
            this.searchTerm = `${item.label} `;
            this.processSearchTerm(this.searchTerm);
        } else if (this.suggestionType === 'make') {
            this.searchTerm = `${this.parsedYear} ${item.label} `;
            this.processSearchTerm(this.searchTerm);
        } else if (this.suggestionType === 'model') {
            // Model selected!
            this.searchTerm = `${this.parsedYear} ${this.parsedMake?.label} ${item.label}`;
            this.handleModelSelection(item);
        }
    }

    handleModelSelection(model: VehicleOption) {
        if (model.engines && model.engines.length > 1) {
            // Show engines
            this.suggestions = model.engines.map(e => ({
                ...e,
                label: e.name, // Normalize for template
                isEngine: true,
                model: model // Keep ref
            }));
            this.suggestionType = 'engine';
        } else if (model.engines && model.engines.length === 1) {
            this.navigateToVehicle(model.engines[0].id, model, this.parsedYear!, this.parsedMake!.label, model.label);
        } else {
            this.navigateToVehicle(model.id, model, this.parsedYear!, this.parsedMake!.label, model.label);
        }
    }

    selectEngine(engine: any) {
        this.navigateToVehicle(engine.id, engine.model, this.parsedYear!, this.parsedMake!.label, engine.model.label);
    }

    navigateToVehicle(vehicleId: string, model: VehicleOption, year: string, make: string, modelName: string) {
        const vehicleParams = {
            year: year,
            make: make,
            model: modelName,
            vehicleId: vehicleId,
            contentSource: this.selectedContentSource
        };

        // Save history
        this.saveToRecentVehicles(vehicleId, year, make, modelName);
        localStorage.setItem('currentVehicle', JSON.stringify(vehicleParams));

        this.router.navigate(['/docs'], {
            queryParams: vehicleParams
        });
    }

    saveToRecentVehicles(vehicleId: string, year: string, make: string, model: string) {
        const vehicle = {
            id: Date.now(),
            vehicleId: vehicleId,
            vehicleName: `${year} ${make} ${model}`,
            year: year,
            make: make,
            model: model
        };

        const stored = sessionStorage.getItem('selectedVehicles');
        let vehicles = [];

        if (stored) {
            try {
                vehicles = JSON.parse(stored);
            } catch (e) { }
        }

        vehicles = vehicles.filter((v: any) => v.vehicleId !== vehicle.vehicleId);
        vehicles.unshift(vehicle);
        vehicles = vehicles.slice(0, 10);
        sessionStorage.setItem('selectedVehicles', JSON.stringify(vehicles));
    }

    resetSearch() {
        this.searchTerm = '';
        this.parsedYear = null;
        this.parsedMake = null;
        this.parsedModel = null;
        this.suggestions = [];
        this.loadRecentVehicles();
    }
}
