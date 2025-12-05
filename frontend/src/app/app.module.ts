import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from './core/strategies/custom-route-reuse-strategy';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { DocsComponent } from './docs/docs.component';
import { SearchComponent } from './search/search.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';

import { NavigationComponent } from './core/components/navigation/navigation.component';
import { BottomNavComponent } from './core/components/bottom-nav/bottom-nav.component';
import { VehicleSelectorModalComponent } from './core/components/vehicle-selector-modal/vehicle-selector-modal.component';
import { QuickLookComponent } from './core/components/quick-look/quick-look.component';
import { SearchOverlayComponent } from './core/components/search-overlay/search-overlay.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,

    DocsComponent,
    SearchComponent,
    DiagnosticsComponent,
    NavigationComponent,
    BottomNavComponent,
    VehicleSelectorModalComponent,
    QuickLookComponent,
    SearchOverlayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
