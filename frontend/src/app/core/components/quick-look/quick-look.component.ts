import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { VehicleStateService, CurrentVehicle } from '../../vehicle-state.service';
import { MotorApiService } from '../../../services/motor-api.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-quick-look',
  templateUrl: './quick-look.component.html',
  styleUrls: ['./quick-look.component.scss']
})
export class QuickLookComponent implements OnInit, OnDestroy {
  isOpen$: Observable<boolean>;
  vehicle: CurrentVehicle | null = null;
  loading = false;

  specs: any = null;
  fluids: any[] = [];

  private vehicleSub: Subscription | undefined;
  private openSub: Subscription | undefined;

  constructor(
    private uiService: UiService,
    private vehicleService: VehicleStateService,
    private motorApi: MotorApiService
  ) {
    this.isOpen$ = this.uiService.quickLookOpen$;
  }

  ngOnInit(): void {
    // Watch for vehicle changes
    this.vehicleSub = this.vehicleService.currentVehicle$.subscribe(v => {
      this.vehicle = v;
      if (v && this.uiService.quickLookOpen$) {
        // Pre-fetch if needed, or wait for open
      }
    });

    // Watch for open state to fetch data
    this.openSub = this.isOpen$.subscribe(isOpen => {
      if (isOpen && this.vehicle && !this.specs) {
        this.fetchData(this.vehicle);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.vehicleSub) this.vehicleSub.unsubscribe();
    if (this.openSub) this.openSub.unsubscribe();
  }

  close() {
    this.uiService.closeQuickLook();
  }

  fetchData(vehicle: CurrentVehicle) {
    this.loading = true;
    // In a real scenario, we might need 'contentSource' from somewhere.
    // Assuming 'motor' or similar default, or we need to add it to CurrentVehicle.
    // The current VehicleApiService returns models with `contentSource`.
    // We should probably add contentSource to CurrentVehicle interface.

    // Temporary fallback for contentSource
    const contentSource = 'motor';

    this.motorApi.getSpecs(contentSource, vehicle.vehicleId).subscribe({
      next: (data) => {
        // getSpecs returns { body: { data: [...] } }
        const specsList = data.body?.data || [];

        // We need to extract specific specs from the list
        // This logic mirrors DocsComponent.loadHudData
        const oil = specsList.find((s: any) => s.name?.toLowerCase().includes('oil') && s.category?.toLowerCase().includes('engine'));
        const wheelTorque = specsList.find((s: any) => s.name?.toLowerCase().includes('wheel nut') || s.name?.toLowerCase().includes('lug nut'));
        const battery = specsList.find((s: any) => s.name?.toLowerCase().includes('battery'));

        this.specs = {
          oilCapacity: oil ? `${oil.capacity} ${oil.viscosity || ''}`.trim() : "5.7 qt",
          lugNutTorque: wheelTorque ? wheelTorque.value : "100 ft-lbs",
          batteryGroup: battery ? battery.value : "H6 / 48"
        };

        this.loading = false;
      },
      error: () => this.loading = false
    });

    // Also fetch fluids if possible
    // this.motorApi.getFluids(...)
  }
}
