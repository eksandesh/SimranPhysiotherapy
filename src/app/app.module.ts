import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';

import { LoginComponent } from './pages/login/login.component';
import { WorkspaceComponent } from './pages/workspace/workspace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PatientsComponent } from './pages/patients/patients.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { PackagesComponent } from './pages/packages/packages.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { BackupComponent } from './pages/backup/backup.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    WorkspaceComponent,
    DashboardComponent,
    PatientsComponent,
    AppointmentsComponent,
    PackagesComponent,
    PaymentsComponent,
    ReportsComponent,
    BackupComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
