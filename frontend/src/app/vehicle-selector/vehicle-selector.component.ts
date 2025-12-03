import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MotorApiService } from '../services/motor-api.service';
import { VehicleEngine } from '~/generated/api/models';

interface VehicleOption {
    id: string;
    label: string;
    engines?: VehicleEngine[];
}

type SelectionStep = 'year' | 'make' | 'model' | 'engine';

@Component({
    selector: 'app-vehicle-selector',
    templateUrl: './vehicle-selector.component.html',
    styleUrls: ['./vehicle-selector.component.scss']
})
export class VehicleSelectorComponent implements OnInit {
    loading = false;
    error: string | null = null;

    // Selection State
    currentStep: SelectionStep = 'year';

    // Selected Values
    selectedYear: string | null = null;
    selectedMake: VehicleOption | null = null;
    selectedModel: VehicleOption | null = null;
    selectedContentSource: string = 'MOTOR';

    // Data Lists
    years: VehicleOption[] = [];
    makes: VehicleOption[] = [];
    models: VehicleOption[] = [];
    engines: any[] = []; // For multi-engine models

    // History
    recentVehicles: any[] = [];

    constructor(
        private router: Router,
        private motorApi: MotorApiService
    ) { }

    ngOnInit() {
        this.loadRecentVehicles();
        this.loadYears();
    }

    // ==========================================
    // DATA LOADING
    // ==========================================

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

    async loadMakes(year: string) {
        this.loading = true;
        this.error = null;
        try {
            const response = await this.motorApi.getMakes(parseInt(year)).toPromise();
            if (response && response.body) {
                this.makes = response.body.map(m => ({
                    id: m.makeName,
                    label: m.makeName
                })).sort((a, b) => a.label.localeCompare(b.label));
            }
        } catch (err) {
            console.error('Error fetching makes', err);
            this.error = 'Could not fetch makes. Please try again.';
        } finally {
            this.loading = false;
        }
    }

    async loadModels(year: string, make: string) {
        this.loading = true;
        this.error = null;
        try {
            const response = await this.motorApi.getModels(parseInt(year), make).toPromise();
            if (response && response.body) {
                this.models = response.body.models.map(m => ({
                    id: m.id,
                    label: m.model,
                    engines: m.engines
                }));
                if (response.body.contentSource) {
                    this.selectedContentSource = response.body.contentSource;
                }
            }
        } catch (err) {
            console.error('Error fetching models', err);
            this.error = 'Could not fetch models. Please try again.';
        } finally {
            this.loading = false;
        }
    }

    loadRecentVehicles() {
        const stored = sessionStorage.getItem('selectedVehicles');
        if (stored) {
            try {
                this.recentVehicles = JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing recent vehicles');
            }
        }
    }

    // ==========================================
    // SELECTION HANDLERS
    // ==========================================

    onYearSelect(year: VehicleOption) {
        this.selectedYear = year.id;
        this.currentStep = 'make';
        this.loadMakes(year.id);
    }

    onMakeSelect(make: VehicleOption) {
        this.selectedMake = make;
        this.selectedContentSource = make.label; // Set contentSource to the Make name
        this.currentStep = 'model';
        if (this.selectedYear) {
            this.loadModels(this.selectedYear, make.label);
        }
    }

    onModelSelect(model: VehicleOption) {
        this.selectedModel = model;

        // Check for engines
        if (model.engines && model.engines.length > 1) {
            this.engines = model.engines.map(e => ({
                ...e,
                label: e.name,
                model: model
            }));
            this.currentStep = 'engine';
        } else if (model.engines && model.engines.length === 1) {
            // Auto-select single engine
            this.finalizeSelection(model.engines[0].id, model.label);
        } else {
            // No engine info, just proceed with model ID
            this.finalizeSelection(model.id, model.label);
        }
    }

    onEngineSelect(engine: any) {
        this.finalizeSelection(engine.id, this.selectedModel?.label || '');
    }

    onHistorySelect(vehicle: any) {
        this.navigateToVehicle(vehicle.vehicleId, vehicle.year, vehicle.make, vehicle.model, vehicle.contentSource);
    }

    // ==========================================
    // NAVIGATION & RESET
    // ==========================================

    finalizeSelection(vehicleId: string, modelName: string) {
        if (!this.selectedYear || !this.selectedMake) return;

        this.saveToRecentVehicles(vehicleId, this.selectedYear, this.selectedMake.label, modelName, this.selectedContentSource);
        this.navigateToVehicle(vehicleId, this.selectedYear, this.selectedMake.label, modelName, this.selectedContentSource);
    }

    navigateToVehicle(vehicleId: string, year: string, make: string, model: string, contentSource: string) {
        const vehicleParams = {
            year,
            make,
            model,
            vehicleId,
            contentSource
        };

        localStorage.setItem('currentVehicle', JSON.stringify(vehicleParams));
        this.router.navigate(['/docs'], { queryParams: vehicleParams });
    }

    saveToRecentVehicles(vehicleId: string, year: string, make: string, model: string, contentSource: string) {
        const vehicle = {
            id: Date.now(),
            vehicleId,
            vehicleName: `${year} ${make} ${model}`,
            year,
            make,
            model,
            contentSource
        };

        let vehicles = [...this.recentVehicles];
        // Remove duplicate if exists
        vehicles = vehicles.filter(v => v.vehicleId !== vehicleId);
        // Add to top
        vehicles.unshift(vehicle);
        // Limit to 10
        vehicles = vehicles.slice(0, 10);

        this.recentVehicles = vehicles;
        sessionStorage.setItem('selectedVehicles', JSON.stringify(vehicles));
    }

    reset() {
        this.currentStep = 'year';
        this.selectedYear = null;
        this.selectedMake = null;
        this.selectedModel = null;
        this.makes = [];
        this.models = [];
        this.engines = [];
    }

    goBack() {
        if (this.currentStep === 'engine') {
            this.currentStep = 'model';
            this.selectedModel = null;
        } else if (this.currentStep === 'model') {
            this.currentStep = 'make';
            this.selectedMake = null;
        } else if (this.currentStep === 'make') {
            this.currentStep = 'year';
            this.selectedYear = null;
        }
    }
}
