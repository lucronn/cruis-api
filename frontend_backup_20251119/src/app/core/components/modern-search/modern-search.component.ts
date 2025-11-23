import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'mtr-modern-search',
    templateUrl: './modern-search.component.html',
    styleUrls: ['./modern-search.component.scss']
})
export class ModernSearchComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    searchTerm = '';
    recentSearches = ['Oil Change', 'Brake Pads', 'Tire Rotation'];

    constructor() { }

    onClose() {
        this.close.emit();
    }

    onSearch(term: string) {
        this.searchTerm = term;
        console.log('Searching for:', term);
        // Implement actual search logic here
    }

    clearSearch() {
        this.searchTerm = '';
    }
}
