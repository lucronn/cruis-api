import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './core/components/error/error.component';
import { LayoutComponent } from './core/components/layout/layout.component';
import { ModernLayoutComponent } from './core/components/modern-layout/modern-layout.component';
import { DeltaReportComponent } from './delta-report/delta-report.component';
import { APIUserLogoutGuard } from './guards/api-user-logout-guard';
import { DeltaReportGuard } from './guards/delta-report.guard';
import { MaintenanceSchedulesComponent } from './maintenance-schedules/components/maintenance-schedules.component';
import { ModernDocsComponent } from './core/components/modern-docs/modern-docs.component';
import { VehicleDashboardComponent } from './core/components/vehicle-dashboard/vehicle-dashboard.component';
import { PathParameters } from './url-parameters';

const routes: Routes = [
  {
    path: '',
    component: ModernLayoutComponent,
    canActivate: [APIUserLogoutGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'vehicles',
      },
      {
        path: 'vehicles',
        component: VehicleDashboardComponent,
      },
      {
        path: 'docs/:filterTab',
        component: ModernDocsComponent,
      },
    ],
  },
  {
    path: `delta-report`,
    component: DeltaReportComponent,
    canActivate: [DeltaReportGuard],
  },
  {
    path: '**',
    component: ErrorComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      relativeLinkResolution: 'corrected',
      paramsInheritanceStrategy: 'always',
      initialNavigation: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
