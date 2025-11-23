import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'mtr-modern-vehicle-selector',
    templateUrl: './modern-vehicle-selector.component.html',
    styleUrls: ['./modern-vehicle-selector.component.scss']
})
export class ModernVehicleSelectorComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    // Mock data for now
    years = [2023, 2022, 2021, 2020];
    makes = ['Ford', 'Chevrolet', 'Toyota', 'Honda'];
    models = ['F-150', 'Silverado', 'Camry', 'Civic'];

    step: 'year' | 'make' | 'model' = 'year';
    selectedYear: number | null = null;
    selectedMake: string | null = null;
    selectedModel: string | null = null;

    constructor() { }

    selectYear(year: number) {
        this.selectedYear = year;
        this.step = 'make';
    }

    selectMake(make: string) {
        this.selectedMake = make;
        this.step = 'model';
    }

    selectModel(model: string) {
        this.selectedModel = model;
        this.close.emit();
        // Here we would trigger the actual vehicle selection logic
        console.log('Selected:', this.selectedYear, this.selectedMake, this.selectedModel);
    }

    reset() {
        this.step = 'year';
        this.selectedYear = null;
        this.selectedMake = null;
        this.selectedModel = null;
    }

    onClose() {
        this.close.emit();
    }
}
