import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    // Menu (Sidebar/Drawer) State
    private menuOpenSubject = new BehaviorSubject<boolean>(false);
    menuOpen$ = this.menuOpenSubject.asObservable();

    // Vehicle Selector Modal State
    private vehicleSelectorOpenSubject = new BehaviorSubject<boolean>(false);
    vehicleSelectorOpen$ = this.vehicleSelectorOpenSubject.asObservable();

    // Quick Look Modal State
    private quickLookOpenSubject = new BehaviorSubject<boolean>(false);
    quickLookOpen$ = this.quickLookOpenSubject.asObservable();

    // Search Overlay State
    private searchOpenSubject = new BehaviorSubject<boolean>(false);
    searchOpen$ = this.searchOpenSubject.asObservable();

    private navToggleVisibleSubject = new BehaviorSubject<boolean>(true);
    navToggleVisible$ = this.navToggleVisibleSubject.asObservable();

    // Menu Actions
    toggleMenu() {
        this.menuOpenSubject.next(!this.menuOpenSubject.value);
    }
    closeMenu() {
        this.menuOpenSubject.next(false);
    }
    openMenu() {
        this.menuOpenSubject.next(true);
    }

    // Vehicle Selector Actions
    openVehicleSelector() {
        this.vehicleSelectorOpenSubject.next(true);
        // Close others
        this.closeQuickLook();
        this.closeSearch();
        this.closeMenu();
    }
    closeVehicleSelector() {
        this.vehicleSelectorOpenSubject.next(false);
    }

    // Quick Look Actions
    toggleQuickLook() {
        if (this.quickLookOpenSubject.value) {
            this.closeQuickLook();
        } else {
            this.openQuickLook();
        }
    }
    openQuickLook() {
        this.quickLookOpenSubject.next(true);
        this.closeVehicleSelector();
        this.closeSearch();
    }
    closeQuickLook() {
        this.quickLookOpenSubject.next(false);
    }

    // Search Actions
    toggleSearch() {
        if (this.searchOpenSubject.value) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }
    openSearch() {
        this.searchOpenSubject.next(true);
        this.closeVehicleSelector();
        this.closeQuickLook();
    }
    closeSearch() {
        this.searchOpenSubject.next(false);
    }

    setNavToggleVisible(visible: boolean) {
        this.navToggleVisibleSubject.next(visible);
    }
}
