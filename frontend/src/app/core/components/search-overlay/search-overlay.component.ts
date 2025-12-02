import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UiService } from '../../../services/ui.service';
import { VehicleStateService } from '../../vehicle-state.service';
import { MotorApiService } from '../../../services/motor-api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-search-overlay',
  templateUrl: './search-overlay.component.html',
  styleUrls: ['./search-overlay.component.scss']
})
export class SearchOverlayComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  isOpen$: Observable<boolean>;
  searchTerm = '';
  loading = false;
  searched = false;
  results: any[] = [];
  recentSearches: string[] = ['Oil Change', 'Brake Pads', 'Alternator']; // Mock for now

  constructor(
    private uiService: UiService,
    private vehicleService: VehicleStateService,
    private motorApi: MotorApiService
  ) {
    this.isOpen$ = this.uiService.searchOpen$;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
      // Focus input when opened
      this.isOpen$.subscribe(isOpen => {
          if (isOpen) {
              setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
          }
      });
  }

  close() {
    this.uiService.closeSearch();
  }

  clear() {
      this.searchTerm = '';
      this.searched = false;
      this.results = [];
  }

  search() {
      if (!this.searchTerm.trim()) return;

      const vehicle = this.vehicleService.getCurrentVehicle();
      if (!vehicle) {
          alert('Please select a vehicle first');
          return;
      }

      this.loading = true;
      this.searched = true;

      // Mock search or actual API call
      // this.motorApi.getArticles('MOTOR', vehicle.vehicleId, this.searchTerm)...

      // Mocking results for UI verification
      setTimeout(() => {
          this.results = [
              { title: 'Replace ' + this.searchTerm, category: 'Repair Procedure', id: '1' },
              { title: this.searchTerm + ' Wiring Diagram', category: 'Wiring', id: '2' },
              { title: this.searchTerm + ' Specifications', category: 'Specs', id: '3' }
          ];
          this.loading = false;
      }, 500);
  }

  applySearch(term: string) {
      this.searchTerm = term;
      this.search();
  }

  openResult(result: any) {
      console.log('Opening result', result);
      this.close();
      // Navigate to result
  }
}
