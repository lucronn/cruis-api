import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UiService } from '../../../services/ui.service';

@Component({
    selector: 'app-bottom-nav',
    templateUrl: './bottom-nav.component.html',
    styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {
    activeTab = 'home';

    constructor(private router: Router, private uiService: UiService) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            if (event.url.includes('/docs')) {
                this.activeTab = 'vehicle';
            } else {
                this.activeTab = 'home';
            }
        });
    }

    navigateToHome() {
        this.router.navigate(['/']);
    }

    navigateToVehicle() {
        // If we have a vehicle in history/state, go there?
        // Or just go to vehicle selector if no vehicle?
        // For now, let's assume the user wants to go to the last viewed vehicle or selector.
        // But we don't track "last vehicle" easily here unless we store it.
        // If we are ALREADY on vehicle, do nothing.
        // If we are on home, and click vehicle, where do we go?
        // Maybe '/vehicles'?
        this.router.navigate(['/vehicles']);
    }

    toggleMenu() {
        this.uiService.toggleMenu();
    }
}
