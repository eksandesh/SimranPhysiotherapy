import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  Clinic,
  Patient,
  Payment,
  Assigned,
  MODES,
  day,
  pretty,
  money,
  used,
  left,
  balance,
  billed,
  received
} from '../../models/clinic.model';

@Component({
  selector: 'app-payments-page',
  template: `
    <div *ngIf="clinic">
      <div class="statgrid">
        <div class="stat" *ngFor="let s of stats">
          <div class="statline">
            <span>{{ s.label }}</span>
          </div>
          <strong>{{ formatMoney(s.amount) }}</strong>
        </div>
      </div>

      <section class="panel patientpanel" style="margin-top: 18px;">
        <div class="panelhead">
          <h2>Payments received</h2>
          <div class="filters">
            <input
              type="month"
              aria-label="Filter by month"
              [(ngModel)]="filterMonth"
            />
            <select aria-label="Filter by payment mode" [(ngModel)]="filterMode">
              <option value="All modes">All modes</option>
              <option *ngFor="let m of modes" [value]="m">{{ m }}</option>
            </select>
          </div>
        </div>

        <div class="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Towards</th>
                <th>Mode</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPayments" (click)="editPayment.emit(p)">
                <td>{{ p.id }}</td>
                <td>{{ formatDate(p.date) }}</td>
                <td><b>{{ getPatientName(p.patient) }}</b></td>
                <td>{{ getTowardsText(p) }}</td>
                <td>{{ p.mode }}</td>
                <td><b>{{ formatMoney(p.amount) }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="filteredPayments.length === 0" class="empty">
          <p>No payments found.</p>
        </div>

        <p *ngIf="filteredPayments.length > 0" class="tablefoot">
          {{ filteredPayments.length }} payment{{ filteredPayments.length === 1 ? '' : 's' }} ·
          {{ formatMoney(totalFilteredAmount) }}
        </p>
      </section>

      <section class="panel patientpanel" style="margin-top: 18px;">
        <div class="panelhead">
          <h2>Pending dues</h2>
        </div>

        <div class="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Billed</th>
                <th>Received</th>
                <th>Balance due</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of pendingDues" (click)="viewPatient.emit(d.p)">
                <td>
                  <b>{{ d.p.name }}</b>
                  <small>{{ d.p.id }}{{ d.p.phone ? ' · ' + d.p.phone : '' }}</small>
                </td>
                <td>{{ formatMoney(getBilled(d.p.id)) }}</td>
                <td>{{ formatMoney(getReceived(d.p.id)) }}</td>
                <td><b class="owe">{{ formatMoney(d.due) }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="pendingDues.length === 0" class="empty">
          <app-icon name="UserRoundPlus" [size]="28"></app-icon>
          <p>No pending dues.</p>
        </div>
      </section>
    </div>
  `
})
export class PaymentsPageComponent {
  @Input() clinic: Clinic | null = null;
  @Output() editPayment = new EventEmitter<Payment>();
  @Output() viewPatient = new EventEmitter<Patient>();

  filterMonth = '';
  filterMode = 'All modes';
  modes = MODES;

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
}

@Component({
  selector: 'app-patient-billing',
  template: `
    <div *ngIf="clinic && patient">
      <h3>Packages</h3>
      <div class="pkgcard" *ngFor="let a of assignedPackages">
        <div class="pkgtop">
          <b>{{ a.name }}</b>
          <span [class]="'badge ' + getBadgeClass(a)">
            {{ getBadgeText(a) }}
          </span>
        </div>

        <div class="meter" role="img" [attr.aria-label]="getMeterLabel(a)">
          <i [style.width.%]="getMeterPercentage(a)"></i>
        </div>

        <small>
          <b class="remain">Remaining: {{ getLeftSessions(a) }} of {{ a.sessions }}</b> ·
          {{ getUsedSessions(a) }} attended ·
          {{ formatMoney(a.rate) }} per session
        </small>
        <small>
          Package total {{ formatMoney(a.sessions * a.rate) }} ·
          Paid towards it {{ formatMoney(getPaidTowards(a.id)) }} ·
          Started {{ formatDate(a.date) }}
        </small>

        <button
          *ngIf="getUsedSessions(a) === 0"
          class="link"
          (click)="removePackage.emit(a)"
        >
          <app-icon name="Trash2" [size]="13"></app-icon>
          Remove package
        </button>
      </div>

      <p *ngIf="assignedPackages.length === 0">
        No package assigned. Walk-in visits are billed per visit.
      </p>

      <div class="buttons">
        <button class="secondary" (click)="assignPackage.emit()">
          <app-icon name="Package" [size]="15"></app-icon>
          Assign package
        </button>
      </div>

      <h3 class="gap">Billing summary</h3>
      <div class="sumgrid">
        <div>
          <small>Billed</small>
          <b>{{ formatMoney(patientBilled) }}</b>
        </div>
        <div>
          <small>Received</small>
          <b>{{ formatMoney(patientReceived) }}</b>
        </div>
        <div>
          <small>{{ patientBal < -0.004 ? 'Advance' : 'Balance due' }}</small>
          <b [class.owe]="patientBal > 0.004" [class.adv]="patientBal < -0.004">
            {{ formatMoney(absBalance) }}
          </b>
        </div>
      </div>

      <h3 class="gap">Payments</h3>
      <button
        class="history"
        *ngFor="let p of patientPayments"
        (click)="editPayment.emit(p)"
      >
        {{ formatDate(p.date) }} · {{ formatMoney(p.amount) }} · {{ p.mode }}
        {{ getPaymentPackageName(p) }}
        <app-icon name="ChevronRight" [size]="14"></app-icon>
      </button>

      <p *ngIf="patientPayments.length === 0">No payments recorded.</p>

      <div class="buttons">
        <button class="secondary" (click)="editPayment.emit(undefined)">
          <app-icon name="Plus" [size]="15"></app-icon>
          Record payment
        </button>
      </div>
    </div>
  `
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

@Component({
  selector: 'app-payment-form',
  template: `
    <form (ngSubmit)="submit()" *ngIf="clinic">
      <div class="fields">
        <label>
          Patient
          <select
            name="patient"
            [(ngModel)]="patientId"
            [disabled]="isEdit"
            required
          >
            <option value="" disabled>Select a patient</option>
            <option *ngFor="let pt of clinic.patients" [value]="pt.id">
              {{ pt.name }} · {{ pt.id }}
            </option>
          </select>
        </label>

        <div *ngIf="patientId" class="calc">
          {{ calculatedBalText }} <b>{{ formatMoney(absBal) }}</b>
        </div>

        <div class="pair">
          <label>
            Amount received (₹)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              autoFocus
              [(ngModel)]="amount"
            />
          </label>
          <label>
            Date
            <input
              name="date"
              type="date"
              required
              [(ngModel)]="date"
            />
          </label>
        </div>

        <div class="pair">
          <label>
            Payment mode
            <select name="mode" [(ngModel)]="mode">
              <option *ngFor="let m of modes" [value]="m">{{ m }}</option>
            </select>
          </label>
          <label>
            Towards
            <select name="pp" [(ngModel)]="pp">
              <option value="">General / visit fee</option>
              <option *ngFor="let a of availablePacks" [value]="a.id">
                {{ a.name }} · {{ formatDate(a.date) }}
              </option>
            </select>
          </label>
        </div>

        <label>
          Note
          <input
            name="note"
            maxlength="120"
            [(ngModel)]="note"
            placeholder="Optional"
          />
        </label>
      </div>

      <div *ngIf="error" role="alert" class="formerr">{{ error }}</div>

      <div class="buttons formend">
        <button class="primary" type="submit">
          {{ isEdit ? 'Save changes' : 'Save payment' }}
        </button>
        <button
          *ngIf="isEdit"
          type="button"
          class="secondary"
          (click)="onPrint()"
        >
          <app-icon name="Printer" [size]="15"></app-icon>
          Receipt
        </button>
        <button
          *ngIf="isEdit"
          type="button"
          class="secondary"
          (click)="deletePayment.emit(paymentData)"
        >
          <app-icon name="Trash2" [size]="15"></app-icon>
          Delete
        </button>
      </div>
    </form>
  `
})
export class PaymentFormComponent implements OnInit {
  @Input() clinic: Clinic | null = null;
  @Input() paymentData?: Payment;
  @Input() fixedPatientId?: string;
  @Output() commit = new EventEmitter<Payment>();
  @Output() deletePayment = new EventEmitter<Payment>();
  @Output() printReceipt = new EventEmitter<Payment>();

  patientId = '';
  amount = '';
  date = day();
  mode = 'Cash';
  pp = '';
  note = '';
  error = '';
  modes = MODES;

  get isEdit(): boolean {
    return !!this.paymentData;
  }

  ngOnInit() {
    if (this.paymentData) {
      this.patientId = this.paymentData.patient;
      this.amount = String(this.paymentData.amount);
      this.date = this.paymentData.date;
      this.mode = this.paymentData.mode;
      this.pp = this.paymentData.pp || '';
      this.note = this.paymentData.note || '';
    } else if (this.fixedPatientId) {
      this.patientId = this.fixedPatientId;
    }
  }

  formatMoney(n: number): string {
    return money(n);
  }

  formatDate(d: string): string {
    return pretty(d);
  }

  get availablePacks(): Assigned[] {
    if (!this.clinic || !this.patientId) return [];
    return this.clinic.assigned.filter(a => a.patient === this.patientId);
  }

  get currentBalance(): number {
    return this.clinic && this.patientId ? balance(this.clinic, this.patientId) : 0;
  }

  get absBal(): number {
    return Math.abs(this.currentBalance);
  }

  get calculatedBalText(): string {
    const bal = this.currentBalance;
    return bal > 0.004 ? 'Balance due' : bal < -0.004 ? 'Advance paid' : 'Balance';
  }

  onPrint() {
    if (this.paymentData) {
      this.printReceipt.emit(this.paymentData);
    }
  }

  submit() {
    if (!this.patientId) {
      this.error = 'Select a patient.';
      return;
    }
    const amt = Number(this.amount);
    if (!(amt > 0)) {
      this.error = 'Enter an amount greater than zero.';
      return;
    }

    const pay: Payment = {
      id: this.paymentData?.id || '',
      patient: this.patientId,
      date: this.date,
      amount: amt,
      mode: this.mode,
      note: (this.note || '').trim(),
      pp: this.pp || '',
      visit: this.paymentData?.visit || ''
    };

    this.commit.emit(pay);
  }
}

@Component({
  selector: 'app-assign-form',
  template: `
    <div *ngIf="clinic">
      <div *ngIf="activePackages.length === 0">
        <p>Create a package in the Packages page first, then assign it here.</p>
        <button class="primary" (click)="goPackages.emit()">Go to Packages</button>
      </div>

      <form *ngIf="activePackages.length > 0" (ngSubmit)="submit()">
        <div class="fields">
          <label>
            Package
            <select name="pkgId" [(ngModel)]="pkgId" (ngModelChange)="onPackageChange($event)">
              <option *ngFor="let k of activePackages" [value]="k.id">
                {{ k.name }} · {{ k.sessions }} sessions
              </option>
            </select>
          </label>

          <div class="pair">
            <label>
              Cost per session (₹)
              <input
                name="rate"
                type="number"
                min="0"
                step="0.01"
                required
                [(ngModel)]="rate"
              />
            </label>
            <label>
              Start date
              <input
                name="date"
                type="date"
                required
                [(ngModel)]="date"
              />
            </label>
          </div>

          <div class="calc" *ngIf="selectedPackage">
            {{ selectedPackage.sessions }} sessions × {{ formatMoney(numericRate) }} =
            <b>{{ formatMoney(totalCost) }}</b>
          </div>

          <div class="pair">
            <label>
              Payment received now (₹)
              <input
                name="received"
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional"
                [(ngModel)]="receivedAmount"
              />
            </label>
            <label>
              Mode
              <select name="mode" [(ngModel)]="mode">
                <option *ngFor="let m of modes" [value]="m">{{ m }}</option>
              </select>
            </label>
          </div>
        </div>

        <button class="primary formend" type="submit">Assign package</button>
      </form>
    </div>
  `
})
export class AssignFormComponent implements OnInit {
  @Input() clinic: Clinic | null = null;
  @Input() patientId = '';
  @Output() commit = new EventEmitter<{ assigned: Assigned; payment?: { amount: number; mode: string } }>();
  @Output() goPackages = new EventEmitter<void>();

  pkgId = '';
  rate = '0';
  date = day();
  receivedAmount = '';
  mode = 'Cash';
  modes = MODES;

  get activePackages(): any[] {
    return this.clinic ? this.clinic.packages.filter(k => k.active) : [];
  }

  get selectedPackage(): any {
    return this.activePackages.find(k => k.id === this.pkgId);
  }

  get numericRate(): number {
    return Number(this.rate) || 0;
  }

  get totalCost(): number {
    return this.selectedPackage ? this.selectedPackage.sessions * this.numericRate : 0;
  }

  ngOnInit() {
    if (this.activePackages.length > 0) {
      this.pkgId = this.activePackages[0].id;
      this.rate = String(this.activePackages[0].rate ?? 0);
    }
  }

  onPackageChange(newPkgId: string) {
    const p = this.activePackages.find(k => k.id === newPkgId);
    if (p) {
      this.rate = String(p.rate ?? 0);
    }
  }

  formatMoney(n: number): string {
    return money(n);
  }

  submit() {
    const k = this.selectedPackage;
    const r = Number(this.rate);
    if (!k || !(r >= 0)) return;

    const assigned: Assigned = {
      id: crypto.randomUUID(),
      patient: this.patientId,
      pkg: k.id,
      name: k.name,
      sessions: k.sessions,
      rate: r,
      date: this.date
    };

    const amt = Number(this.receivedAmount) || 0;
    const payment = amt > 0 ? { amount: amt, mode: this.mode } : undefined;

    this.commit.emit({ assigned, payment });
  }
}

