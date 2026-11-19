import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Clinic, Patient, remainingFor, balance, money } from '../../../models/clinic.model';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css']
})
export class PatientListComponent {
  @Input() patients: Patient[] = [];
  @Input() clinic: Clinic | null = null;
  @Input() showMore = false;
  @Output() pick = new EventEmitter<Patient>();
  @Output() more = new EventEmitter<void>();

  getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0])
      .join('');
  }

  hasAssigned(patientId: string): boolean {
    return !!this.clinic?.assigned.some(a => a.patient === patientId);
  }

  getRemaining(patientId: string): number {
    return this.clinic ? remainingFor(this.clinic, patientId) : 0;
  }

  getBalance(patientId: string): number {
    return this.clinic ? balance(this.clinic, patientId) : 0;
  }

  getBalanceState(patientId: string): 'owe' | 'adv' | 'none' {
    const bal = this.getBalance(patientId);
    if (bal > 0.004) return 'owe';
    if (bal < -0.004) return 'adv';
    return 'none';
  }

  formatBalance(patientId: string): string {
    const bal = Math.abs(this.getBalance(patientId));
    return money(bal);
  }
}

