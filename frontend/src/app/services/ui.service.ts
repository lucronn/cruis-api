import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    private menuOpenSubject = new BehaviorSubject<boolean>(false);
    menuOpen$ = this.menuOpenSubject.asObservable();

    private navToggleVisibleSubject = new BehaviorSubject<boolean>(true);
    navToggleVisible$ = this.navToggleVisibleSubject.asObservable();

    toggleMenu() {
        this.menuOpenSubject.next(!this.menuOpenSubject.value);
    }

    setNavToggleVisible(visible: boolean) {
        this.navToggleVisibleSubject.next(visible);
    }

    closeMenu() {
        this.menuOpenSubject.next(false);
    }

    openMenu() {
        this.menuOpenSubject.next(true);
    }
}
