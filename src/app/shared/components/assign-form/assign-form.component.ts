import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Clinic, Assigned, MODES, day, money } from '../../../models/clinic.model';

@Component({
  selector: 'app-assign-form',
  templateUrl: './assign-form.component.html',
  styleUrls: ['./assign-form.component.css']
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

