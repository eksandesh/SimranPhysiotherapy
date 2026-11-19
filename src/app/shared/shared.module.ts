import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IconComponent } from './components/icon/icon.component';
import { BadgeComponent } from './components/badge/badge.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { PatientListComponent } from './components/patient-list/patient-list.component';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { VisitFormComponent } from './components/visit-form/visit-form.component';
import { PackageFormComponent } from './components/package-form/package-form.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { AssignFormComponent } from './components/assign-form/assign-form.component';
import { PatientBillingComponent } from './components/patient-billing/patient-billing.component';
import { PatientDetailComponent } from './components/patient-detail/patient-detail.component';

@NgModule({
  declarations: [
    IconComponent,
    BadgeComponent,
    DialogComponent,
    PatientListComponent,
    PatientFormComponent,
    VisitFormComponent,
    PackageFormComponent,
    PaymentFormComponent,
    AssignFormComponent,
    PatientBillingComponent,
    PatientDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconComponent,
    BadgeComponent,
    DialogComponent,
    PatientListComponent,
    PatientFormComponent,
    VisitFormComponent,
    PackageFormComponent,
    PaymentFormComponent,
    AssignFormComponent,
    PatientBillingComponent,
    PatientDetailComponent
  ]
})
export class SharedModule { }
