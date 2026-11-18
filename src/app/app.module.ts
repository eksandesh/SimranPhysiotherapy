import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IconComponent } from './components/icon/icon.component';
import { BadgeComponent } from './components/badge/badge.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { LoginComponent } from './components/login/login.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { OverviewComponent } from './components/overview/overview.component';
import { PatientListComponent } from './components/patients/patient-list.component';
import { PatientsPageComponent } from './components/patients/patients-page.component';
import { AppointmentsPageComponent } from './components/appointments/appointments-page.component';
import {
  PackagesPageComponent,
  PackageFormComponent
} from './components/packages/packages.component';
import {
  PaymentsPageComponent,
  PatientBillingComponent,
  PaymentFormComponent,
  AssignFormComponent
} from './components/billing/billing.component';
import {
  PatientFormComponent,
  VisitFormComponent,
  PatientDetailComponent
} from './components/dialog-forms/dialog-forms.component';
import {
  ReportsPageComponent,
  BackupPageComponent
} from './components/system-pages/system-pages.component';

@NgModule({
  declarations: [
    AppComponent,
    IconComponent,
    BadgeComponent,
    DialogComponent,
    LoginComponent,
    WorkspaceComponent,
    OverviewComponent,
    PatientListComponent,
    PatientsPageComponent,
    AppointmentsPageComponent,
    PackagesPageComponent,
    PackageFormComponent,
    PaymentsPageComponent,
    PatientBillingComponent,
    PaymentFormComponent,
    AssignFormComponent,
    PatientFormComponent,
    VisitFormComponent,
    PatientDetailComponent,
    ReportsPageComponent,
    BackupPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
