import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { VehicleApiService } from '../../../services/vehicle-api.service';
import { VehicleStateService } from '../../vehicle-state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-vehicle-selector-modal',
  templateUrl: './vehicle-selector-modal.component.html',
  styleUrls: ['./vehicle-selector-modal.component.scss'],
  // standalone: true, // Assuming Angular 14+, but will stick to module based if needed.
  // Given the project structure with app.module.ts, I'll assume module-based.
})
export class VehicleSelectorModalComponent implements OnInit {
  isOpen$: Observable<boolean>;

  step: 'year' | 'make' | 'model' = 'year';
  loading = false;

  years: number[] = [];
  makes: any[] = [];
  models: any[] = [];

  selectedYear: number | null = null;
  selectedMake: any | null = null;
  selectedModel: any | null = null;

  constructor(
    private uiService: UiService,
    private vehicleApiService: VehicleApiService,
    private vehicleService: VehicleStateService
  ) {
    this.isOpen$ = this.uiService.vehicleSelectorOpen$;
  }

  ngOnInit(): void {
    // Load initial years
    this.loadYears();
  }

  close() {
    this.uiService.closeVehicleSelector();
    // Reset state after closing? maybe not to keep context
  }

  setStep(step: 'year' | 'make' | 'model') {
    this.step = step;
  }

  loadYears() {
    this.loading = true;
    this.vehicleApiService.getYears().subscribe({
      next: (data: any) => { // API returns object with years array or just array?
         // Looking at vehicle-api.service.ts: getYears() returns Observable<number[]>
         // But motor-api.service.ts returns YearsResponse object.
         // Let's assume VehicleApiService wraps it correctly or returns raw.
         // Based on read_file of VehicleApiService, it returns number[].
         this.years = data || [];
         this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load years', err);
        this.loading = false;
      }
    });
  }

  selectYear(year: number) {
    this.selectedYear = year;
    this.step = 'make';
    this.loadMakes(year);
  }

  loadMakes(year: number) {
    this.loading = true;
    this.vehicleApiService.getMakes(year).subscribe({
      next: (data) => {
        this.makes = data.makes || [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  selectMake(make: any) {
    this.selectedMake = make;
    this.step = 'model';
    if (this.selectedYear) {
        this.loadModels(this.selectedYear, make.makeName);
    }
  }

  loadModels(year: number, make: string) {
    this.loading = true;
    this.vehicleApiService.getModels(year, make).subscribe({
      next: (data) => {
        this.models = data.models || [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  selectModel(model: any) {
    this.selectedModel = model;

    // Commit selection
    if (this.selectedYear && this.selectedMake) {
        this.vehicleService.setVehicle({
            year: this.selectedYear,
            make: this.selectedMake.makeName,
            model: model.model,
            vehicleId: model.id,
            vehicleName: `${this.selectedYear} ${this.selectedMake.makeName} ${model.model}`
        });
        this.close();
    }
  }
}
