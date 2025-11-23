import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'mtr-modern-layout',
    templateUrl: './modern-layout.component.html',
    styleUrls: ['./modern-layout.component.scss']
})
export class ModernLayoutComponent implements OnInit {
    isMobileMenuOpen = false;

    // Placeholder for Observables that will come from services later
    activeVehicle$: Observable<string> = of('2023 Ford F-150');
    userName$: Observable<string> = of('John Doe');

    constructor() { }

    ngOnInit(): void {
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }

    isVehicleSelectorOpen = false;

    openVehicleSelector() {
        this.isVehicleSelectorOpen = true;
        // Prevent default navigation if needed, or let it navigate to /vehicles and also open the selector
    }

    closeVehicleSelector() {
        this.isVehicleSelectorOpen = false;
    }

    isSearchOpen = false;

    openSearch() {
        this.isSearchOpen = true;
    }

    closeSearch() {
        this.isSearchOpen = false;
    }
}
