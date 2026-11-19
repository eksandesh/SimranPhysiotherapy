import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  Clinic,
  Payment,
  Assigned,
  MODES,
  day,
  pretty,
  money,
  balance
} from '../../../models/clinic.model';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.css']
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

