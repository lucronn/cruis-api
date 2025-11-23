import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VehicleSelectorComponent } from './vehicle-selector/vehicle-selector.component';
import { DocsComponent } from './docs/docs.component';
import { SearchComponent } from './search/search.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    VehicleSelectorComponent,
    DocsComponent,
    SearchComponent,
    DiagnosticsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
