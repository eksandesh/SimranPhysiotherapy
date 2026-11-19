import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Clinic,
  Patient,
  Visit,
  Assigned,
  Payment,
  pretty
} from '../../../models/clinic.model';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css']
})
export class PatientDetailComponent {
  @Input() clinic: Clinic | null = null;
  @Input() patient: Patient | null = null;
  @Output() assignPackage = new EventEmitter<void>();
  @Output() editPayment = new EventEmitter<Payment | undefined>();
  @Output() removePackage = new EventEmitter<Assigned>();
  @Output() editVisit = new EventEmitter<Visit>();
  @Output() bookSession = new EventEmitter<void>();
  @Output() editPatient = new EventEmitter<void>();
  @Output() downloadReport = new EventEmitter<void>();

  formatDate(d: string): string {
    return pretty(d);
  }

  get patientVisits(): Visit[] {
    if (!this.clinic || !this.patient) return [];
    return this.clinic.visits
      .filter(v => v.patient === this.patient!.id)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }

  getVisitPackageName(v: Visit): string {
    if (!this.clinic) return '';
    const pkg = this.clinic.assigned.find(a => a.id === v.pp);
    return pkg ? ` · ${pkg.name}` : ' · Walk-in';
  }
}

