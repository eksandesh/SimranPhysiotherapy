import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import {
  Clinic,
  Patient,
  Payment,
  MODES,
  day,
  pretty,
  money,
  balance,
  billed,
  received
} from '../../models/clinic.model';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  filterMonth = '';
  filterMode = 'All modes';
  modes = MODES;

  private sub?: Subscription;

  constructor(
    private clinicService: ClinicService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.sub = this.clinicService.clinic$.subscribe(c => {
      this.clinic = c;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  formatMoney(n: number): string {
    return money(n);
  }

  formatDate(d: string): string {
    return pretty(d);
  }

  getPatientName(id: string): string {
    return this.clinic?.patients.find(p => p.id === id)?.name || '';
  }

  getTowardsText(p: Payment): string {
    if (!this.clinic) return 'General';
    const pkg = this.clinic.assigned.find(a => a.id === p.pp);
    if (pkg) return pkg.name;
    return p.visit ? 'Visit fee' : 'General';
  }

  getBilled(patientId: string): number {
    return this.clinic ? billed(this.clinic, patientId) : 0;
  }

  getReceived(patientId: string): number {
    return this.clinic ? received(this.clinic, patientId) : 0;
  }

  get filteredPayments(): Payment[] {
    if (!this.clinic) return [];
    return this.clinic.payments
      .filter(p => (!this.filterMonth || p.date.startsWith(this.filterMonth)) &&
                   (this.filterMode === 'All modes' || p.mode === this.filterMode))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }));
  }

  get totalFilteredAmount(): number {
    return this.filteredPayments.reduce((s, p) => s + p.amount, 0);
  }

  get pendingDues(): { p: Patient; due: number }[] {
    if (!this.clinic) return [];
    return this.clinic.patients
      .map(p => ({ p, due: balance(this.clinic!, p.id) }))
      .filter(x => x.due > 0.004)
      .sort((a, b) => b.due - a.due);
  }

  get stats() {
    if (!this.clinic) return [];
    const today = day();
    const sumToday = this.clinic.payments
      .filter(p => p.date === today)
      .reduce((s, p) => s + p.amount, 0);

    const sumMonth = this.clinic.payments
      .filter(p => p.date.startsWith(today.slice(0, 7)))
      .reduce((s, p) => s + p.amount, 0);

    const sumAll = this.clinic.payments.reduce((s, p) => s + p.amount, 0);
    const pendingTotal = this.pendingDues.reduce((s, x) => s + x.due, 0);

    return [
      { label: 'Today', amount: sumToday },
      { label: 'This month', amount: sumMonth },
      { label: 'Total received', amount: sumAll },
      { label: 'Pending dues', amount: pendingTotal }
    ];
  }

  editPayment(p: Payment): void {
    this.dialogService.recordPayment(p);
  }

  viewPatient(p: Patient): void {
    this.dialogService.viewPatient(p);
  }
}
