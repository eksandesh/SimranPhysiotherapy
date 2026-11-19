import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  Clinic,
  Visit,
  Assigned,
  MODES,
  day,
  used
} from '../../../models/clinic.model';

@Component({
  selector: 'app-visit-form',
  templateUrl: './visit-form.component.html',
  styleUrls: ['./visit-form.component.css']
})
export class VisitFormComponent implements OnInit {
  @Input() clinic: Clinic | null = null;
  @Input() visitData?: Visit;
  @Input() fixedPatientId?: string;
  @Output() commit = new EventEmitter<{ visit: Visit; payment?: { amount: number; mode: string } }>();
  @Output() deleteVisit = new EventEmitter<Visit>();

  patientId = '';
  pp = '';
  visitDate = day();
  visitTime = '09:00';
  sessionStatus = 'Scheduled';
  fee = '';
  receivedAmount = '';
  mode = 'Cash';
  notes = '';
  err = '';
  modes = MODES;

  get isEdit(): boolean {
    return !!this.visitData;
  }

  ngOnInit() {
    if (this.visitData) {
      this.patientId = this.visitData.patient;
      this.pp = this.visitData.pp || '';
      this.visitDate = this.visitData.date;
      this.visitTime = this.visitData.time;
      this.sessionStatus = this.visitData.status;
      this.fee = this.visitData.fee ? String(this.visitData.fee) : '';
      this.notes = this.visitData.notes || '';
    } else {
      this.patientId = this.fixedPatientId || '';
      if (this.patientId) {
        this.pp = this.getFirstAvailablePack(this.patientId);
      }
    }
  }

  getFirstAvailablePack(patientId: string): string {
    if (!this.clinic) return '';
    const packs = this.clinic.assigned
      .filter(a => a.patient === patientId && a.sessions - used(this.clinic!, a.id) > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    return packs[0]?.id || '';
  }

  onPatientChange(newPid: string) {
    this.patientId = newPid;
    this.pp = this.getFirstAvailablePack(newPid);
    this.err = '';
  }

  get availablePacks(): Assigned[] {
    if (!this.clinic || !this.patientId) return [];
    return this.clinic.assigned.filter(
      a =>
        a.patient === this.patientId &&
        (a.id === this.visitData?.pp || a.sessions - used(this.clinic!, a.id) > 0)
    );
  }

  get hasAssignedPacks(): boolean {
    return !!this.clinic?.assigned.some(a => a.patient === this.patientId);
  }

  get selectedPack(): Assigned | undefined {
    return this.clinic?.assigned.find(a => a.id === this.pp);
  }

  getRemainingSessions(a: Assigned): number {
    return this.clinic ? Math.max(0, a.sessions - used(this.clinic, a.id)) : 0;
  }

  formatSessionInfo(): string {
    if (!this.selectedPack || !this.clinic) return '';
    const rem = this.getRemainingSessions(this.selectedPack);
    const consumes =
      (this.sessionStatus === 'Completed' && this.visitData?.status !== 'Completed') ||
      (this.sessionStatus === 'Completed' && this.visitData?.pp !== this.pp);

    if (this.sessionStatus === 'Completed') {
      return consumes
        ? `This session uses 1 of ${rem} remaining → ${Math.max(0, rem - 1)} left after saving`
        : `Session counted · ${rem} left on this package`;
    }
    return `${rem} session${rem === 1 ? '' : 's'} left · 1 is deducted when marked Completed`;
  }

  submit() {
    if (!this.patientId) return;

    if (this.sessionStatus === 'Completed' && this.pp && this.clinic) {
      const a = this.clinic.assigned.find(x => x.id === this.pp);
      const others = this.clinic.visits.filter(
        x => x.pp === this.pp && x.status === 'Completed' && x.id !== this.visitData?.id
      ).length;
      if (!a || a.sessions - others <= 0) {
        this.err = 'No sessions left on this package. Assign a new package or choose Walk-in.';
        return;
      }
    }

    const amt = Number(this.receivedAmount) || 0;
    const payment = amt > 0 ? { amount: amt, mode: this.mode } : undefined;

    const v: Visit = {
      id: this.visitData?.id || crypto.randomUUID(),
      patient: this.patientId,
      date: this.visitDate,
      time: this.visitTime,
      status: this.sessionStatus,
      notes: this.notes,
      pp: this.pp,
      fee: this.pp ? 0 : Math.max(0, Number(this.fee) || 0)
    };

    this.commit.emit({ visit: v, payment });
  }
}

