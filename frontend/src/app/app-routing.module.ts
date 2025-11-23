import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VehicleSelectorComponent } from './vehicle-selector/vehicle-selector.component';
import { DocsComponent } from './docs/docs.component';
import { SearchComponent } from './search/search.component';
import { DiagnosticsComponent } from './diagnostics/diagnostics.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: DashboardComponent
    },
    {
        path: 'vehicles',
        component: VehicleSelectorComponent
    },
    {
        path: 'docs',
        component: DocsComponent
    },
    {
        path: 'search',
        component: SearchComponent
    },
    {
        path: 'diagnostics',
        component: DiagnosticsComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
