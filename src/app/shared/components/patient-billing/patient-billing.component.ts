import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Clinic,
  Patient,
  Payment,
  Assigned,
  pretty,
  money,
  used,
  left,
  balance,
  billed,
  received
} from '../../../models/clinic.model';

@Component({
  selector: 'app-patient-billing',
  templateUrl: './patient-billing.component.html',
  styleUrls: ['./patient-billing.component.css']
})
export class PatientBillingComponent {
  @Input() clinic: Clinic | null = null;
  @Input() patient: Patient | null = null;
  @Output() assignPackage = new EventEmitter<void>();
  @Output() editPayment = new EventEmitter<Payment | undefined>();
  @Output() removePackage = new EventEmitter<Assigned>();

  formatMoney(n: number): string {
    return money(n);
  }

  formatDate(d: string): string {
    return pretty(d);
  }

  get assignedPackages(): Assigned[] {
    if (!this.clinic || !this.patient) return [];
    return this.clinic.assigned
      .filter(a => a.patient === this.patient!.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }

  get patientPayments(): Payment[] {
    if (!this.clinic || !this.patient) return [];
    return this.clinic.payments
      .filter(p => p.patient === this.patient!.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }));
  }

  get patientBilled(): number {
    return this.clinic && this.patient ? billed(this.clinic, this.patient.id) : 0;
  }

  get patientReceived(): number {
    return this.clinic && this.patient ? received(this.clinic, this.patient.id) : 0;
  }

  get patientBal(): number {
    return this.clinic && this.patient ? balance(this.clinic, this.patient.id) : 0;
  }

  get absBalance(): number {
    return Math.abs(this.patientBal);
  }

  getUsedSessions(a: Assigned): number {
    return this.clinic ? used(this.clinic, a.id) : 0;
  }

  getLeftSessions(a: Assigned): number {
    return this.clinic ? left(this.clinic, a) : 0;
  }

  getPaidTowards(assignedId: string): number {
    if (!this.clinic) return 0;
    return this.clinic.payments
      .filter(p => p.pp === assignedId)
      .reduce((s, p) => s + p.amount, 0);
  }

  getBadgeClass(a: Assigned): string {
    const l = this.getLeftSessions(a);
    return l === 0 ? 'red' : l === 1 ? 'amber' : 'green';
  }

  getBadgeText(a: Assigned): string {
    const l = this.getLeftSessions(a);
    return l === 0 ? 'Completed' : `${l} left`;
  }

  getMeterLabel(a: Assigned): string {
    return `${this.getUsedSessions(a)} of ${a.sessions} sessions used`;
  }

  getMeterPercentage(a: Assigned): number {
    const u = this.getUsedSessions(a);
    return Math.min(100, (u / a.sessions) * 100);
  }

  getPaymentPackageName(p: Payment): string {
    if (!this.clinic || !p.pp) return '';
    const pkg = this.clinic.assigned.find(a => a.id === p.pp);
    return pkg ? ` · ${pkg.name}` : '';
  }
}

