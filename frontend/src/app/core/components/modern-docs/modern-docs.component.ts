import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResultsFacade } from '~/search/state/search-results.facade';

@Component({
    selector: 'mtr-modern-docs',
    templateUrl: './modern-docs.component.html',
    styleUrls: ['./modern-docs.component.scss']
})
export class ModernDocsComponent implements OnInit {
    activeTab$: Observable<string>;

    tabs = [
        { id: 'all', label: 'All', icon: 'icon-grid' },
        { id: 'procedures', label: 'Procedures', icon: 'icon-tool' },
        { id: 'diagrams', label: 'Diagrams', icon: 'icon-image' },
        { id: 'specs', label: 'Specs', icon: 'icon-list' },
        { id: 'dtc', label: 'DTC', icon: 'icon-alert' },
        { id: 'bulletins', label: 'Bulletins', icon: 'icon-file' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public searchResultsFacade: SearchResultsFacade
    ) {
        this.activeTab$ = this.route.params.pipe(
            map(params => params['filterTab'] || 'all')
        );
    }

    ngOnInit(): void {
    }

    onTabChange(tabId: string) {
        this.router.navigate(['/docs', tabId], {
            queryParamsHandling: 'merge'
        });
    }
}
