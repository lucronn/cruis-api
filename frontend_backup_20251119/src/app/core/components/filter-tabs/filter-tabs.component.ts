import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResultsFacade } from '~/search/state/search-results.facade';
import { PathParameters } from '~/url-parameters';
import { TabItem } from '~/shared/ui/tabs/tabs.component';

@Component({
  selector: 'mtr-filter-tabs',
  templateUrl: './filter-tabs.component.html',
  styleUrls: ['./filter-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterTabsComponent {
  constructor(
    public searchResultsFacade: SearchResultsFacade,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  activeTabId$: Observable<string> = this.activatedRoute.params.pipe(
    map(params => params[PathParameters.filterTab])
  );

  tabs$: Observable<TabItem[]> = this.searchResultsFacade.filterTabsAndTheirFullBuckets$.pipe(
    map(tabs => tabs.map(tab => ({
      id: tab.filterTab,
      label: tab.filterTab,
      count: 0, // Count will be updated via separate observable in template or here if possible
      disabled: false
    })))
  );

  onTabChange(tabId: string | number) {
    // Find the tab to get the articleTrailId
    this.searchResultsFacade.filterTabsAndTheirFullBuckets$.pipe(
      map(tabs => tabs.find(t => t.filterTab === tabId))
    ).subscribe(tab => {
      if (tab) {
        this.router.navigate(['/docs', tab.filterTab], {
          queryParams: { articleIdTrail: tab.articleTrailId },
          queryParamsHandling: 'merge'
        });
      }
    });
  }
}
