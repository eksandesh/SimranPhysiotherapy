import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { WorkspaceComponent } from './pages/workspace/workspace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PatientsComponent } from './pages/patients/patients.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { PackagesComponent } from './pages/packages/packages.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { BackupComponent } from './pages/backup/backup.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: WorkspaceComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'packages', component: PackagesComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'backup', component: BackupComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
