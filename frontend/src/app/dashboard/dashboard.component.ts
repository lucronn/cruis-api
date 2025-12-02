import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UiService } from '../services/ui.service';
import { VehicleStateService, CurrentVehicle } from '../core/vehicle-state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentVehicle$: Observable<CurrentVehicle | null>;

  // Updated to use FontAwesome class names instead of emojis
  categories = [
    { id: 'maintenance', label: 'Maintenance', iconClass: 'fas fa-tools', route: '/docs' }, // Mapped to docs for now
    { id: 'dtc', label: 'DTCs / Codes', iconClass: 'fas fa-exclamation-triangle', route: '/diagnostics' },
    { id: 'tsb', label: 'TSBs', iconClass: 'fas fa-file-alt', route: '/docs' },
    { id: 'procedures', label: 'Repairs', iconClass: 'fas fa-wrench', route: '/docs' },
    { id: 'wiring', label: 'Wiring', iconClass: 'fas fa-plug', route: '/docs' },
    { id: 'specs', label: 'Specs', iconClass: 'fas fa-ruler-combined', route: '/docs' },
    { id: 'components', label: 'Components', iconClass: 'fas fa-map-marker-alt', route: '/docs' },
    { id: 'parts', label: 'Parts', iconClass: 'fas fa-cogs', route: '/docs' }
  ];

  constructor(
    private router: Router,
    private uiService: UiService,
    private vehicleService: VehicleStateService
  ) {
    this.currentVehicle$ = this.vehicleService.currentVehicle$;
  }

  ngOnInit(): void {
  }

  openVehicleSelector() {
    this.uiService.openVehicleSelector();
  }

  navigate(category: any) {
    const vehicle = this.vehicleService.getCurrentVehicle();
    if (!vehicle) return;

    // Construct query params based on selected category
    // This maintains compatibility with existing DocsComponent which likely expects these
    const queryParams: any = {
        vehicleId: vehicle.vehicleId,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        category: category.id // Pass category so DocsComponent can filter?
    };

    if (category.route === '/diagnostics') {
        this.router.navigate(['/diagnostics'], { queryParams });
    } else {
        this.router.navigate(['/docs'], { queryParams });
    }
  }
}
