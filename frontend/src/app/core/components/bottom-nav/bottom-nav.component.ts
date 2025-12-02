import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UiService } from '../../../services/ui.service';
import { VehicleStateService } from '../../vehicle-state.service';

@Component({
    selector: 'app-bottom-nav',
    templateUrl: './bottom-nav.component.html',
    styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {

    constructor(
        private router: Router,
        public uiService: UiService,
        public vehicleService: VehicleStateService
    ) {}

    goHome() {
        this.router.navigate(['/']);
    }

    openSearch() {
        this.uiService.openSearch();
    }

    openQuickLook() {
        this.uiService.openQuickLook();
    }

    openMenu() {
        this.uiService.openMenu();
    }
}
