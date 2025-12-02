import { Component, OnInit } from '@angular/core';
import { UiService } from './services/ui.service';
import { VehicleStateService, CurrentVehicle } from './core/vehicle-state.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'AutoLib';
    currentVehicle$: Observable<CurrentVehicle | null>;
    menuOpen$: Observable<boolean>;

    constructor(
        private uiService: UiService,
        private vehicleService: VehicleStateService
    ) {
        this.currentVehicle$ = this.vehicleService.currentVehicle$;
        this.menuOpen$ = this.uiService.menuOpen$;
    }

    ngOnInit() {
        // Initial setup if needed
    }

    openVehicleSelector() {
        this.uiService.openVehicleSelector();
    }

    toggleQuickLook() {
        this.uiService.toggleQuickLook();
    }
}
