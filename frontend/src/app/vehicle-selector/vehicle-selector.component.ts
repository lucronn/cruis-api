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
    step: 'year' | 'make' | 'model' | 'engine' = 'year';

    selectedYear: string | null = null;
    selectedMake: string | null = null;
    selectedModel: string | null = null;
    selectedEngine: string | null = null;
    selectedContentSource: string = 'MOTOR'; // Default, will be updated from API

    years: VehicleOption[] = [];
    makes: VehicleOption[] = [];
    models: VehicleOption[] = [];
    engines: VehicleEngine[] = [];

    loading = false;
    error: string | null = null;

    constructor(
        private router: Router,
        private motorApi: MotorApiService
    ) { }

    ngOnInit() {
        this.loadYears();
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

    selectYear(year: VehicleOption) {
        this.selectedYear = year.label;
        this.step = 'make';
        this.loadMakes(parseInt(year.id));
    }

    loadMakes(year: number) {
        this.loading = true;
        this.error = null;

        this.motorApi.getMakes(year)
            .pipe(
                map(response => {
                    if (!response.body || !Array.isArray(response.body)) {
                        throw new Error('Invalid response');
                    }
                    return response.body
                        .map(m => ({
                            id: m.makeName,
                            label: m.makeName
                        }))
                        .sort((a, b) => a.label.localeCompare(b.label));
                }),
                catchError(err => {
                    console.error('Error loading makes:', err);
                    this.error = 'Unable to load makes from Motor API. Please try a different year.';
                    return of([]);
                })
            )
            .subscribe(makes => {
                this.makes = makes;
                this.loading = false;
            });
    }

    selectMake(make: VehicleOption) {
        this.selectedMake = make.label;
        this.step = 'model';
        this.loadModels(parseInt(this.selectedYear!), make.label);
    }

    loadModels(year: number, make: string) {
        this.loading = true;
        this.error = null;

        this.motorApi.getModels(year, make)
            .pipe(
                catchError(err => {
                    console.error('Error loading models:', err);
                    this.error = 'Unable to load models from Motor API. Please try a different year/make combination.';
                    return of({ body: { contentSource: 'MOTOR', models: [] } });
                })
            )
            .subscribe(response => {
                // Store the contentSource from the API response
                if (response.body?.contentSource) {
                    this.selectedContentSource = response.body.contentSource;
                }

                const models = response.body?.models || [];
                this.models = models.map(m => ({
                    id: m.id,
                    label: m.model,
                    engines: m.engines || []
                }));
                this.loading = false;
            });
    }

    selectModel(model: VehicleOption) {
        this.selectedModel = model.label;

        // Check if model has multiple engines
        if (model.engines && model.engines.length > 1) {
            this.engines = model.engines;
            this.step = 'engine';
        } else if (model.engines && model.engines.length === 1) {
            // Auto-select single engine
            this.navigateToVehicle(model.engines[0].id, model);
        } else {
            // No engine info, use model ID
            this.navigateToVehicle(model.id, model);
        }
    }

    selectEngine(engine: VehicleEngine) {
        this.selectedEngine = engine.name;
        const currentModel = this.models.find(m => m.id === this.selectedModel);
        this.navigateToVehicle(engine.id, currentModel!);
    }

    navigateToVehicle(vehicleId: string, model: VehicleOption) {
        // Save to session storage for recent vehicles
        this.saveToRecentVehicles(vehicleId, model);

        this.router.navigate(['/docs'], {
            queryParams: {
                year: this.selectedYear,
                make: this.selectedMake,
                model: this.selectedModel,
                vehicleId: vehicleId,
                contentSource: this.selectedContentSource // Use the API-provided contentSource
            }
        });
    }

    saveToRecentVehicles(vehicleId: string, model: VehicleOption) {
        const vehicle = {
            id: Date.now(),
            vehicleId: vehicleId,
            vehicleName: `${this.selectedYear} ${this.selectedMake} ${this.selectedModel}`,
            year: this.selectedYear,
            make: this.selectedMake,
            model: this.selectedModel
        };

        const stored = sessionStorage.getItem('selectedVehicles');
        let vehicles = [];

        if (stored) {
            try {
                vehicles = JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing stored vehicles');
            }
        }

        vehicles = vehicles.filter((v: any) => v.vehicleId !== vehicle.vehicleId);
        vehicles.unshift(vehicle);
        vehicles = vehicles.slice(0, 10);

        sessionStorage.setItem('selectedVehicles', JSON.stringify(vehicles));
    }

    goBack() {
        if (this.step === 'engine') {
            this.step = 'model';
            this.selectedEngine = null;
        } else if (this.step === 'model') {
            this.step = 'make';
            this.selectedModel = null;
        } else if (this.step === 'make') {
            this.step = 'year';
            this.selectedMake = null;
        }
    }
}
