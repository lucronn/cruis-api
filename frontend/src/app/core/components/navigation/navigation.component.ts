import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UiService } from '../../../services/ui.service';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
    isOpen = false;
    isVisible = true;

    constructor(private uiService: UiService, private router: Router) {
        this.uiService.menuOpen$.subscribe(isOpen => {
            this.isOpen = isOpen;
        });

        // Initial check
        this.isVisible = !this.router.url.includes('/docs');

        // Listen to route changes
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            this.isVisible = !event.url.includes('/docs');
        });
    }

    toggleMenu() {
        this.uiService.toggleMenu();
    }

    closeMenu() {
        this.uiService.closeMenu();
    }
}
