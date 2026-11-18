import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Clinic,
  Visit,
  pretty,
  money,
  left
} from '../../models/clinic.model';

@Component({
  selector: 'app-appointments-page',
  template: `
    <section class="panel" *ngIf="clinic">
      <div class="panelhead">
        <h2>Clinic schedule</h2>
        <label>
          Filter by date
          <input type="date" [(ngModel)]="filterDate" />
        </label>
      </div>

      <div *ngFor="let v of sortedVisits" class="schedule">
        <button class="schedmain" (click)="editVisit.emit(v)">
          <span class="iconbox tint0">
            <app-icon name="CalendarDays" [size]="18"></app-icon>
          </span>
          <span>
            <b>{{ getPatientName(v.patient) }}</b>
            <small>{{ formatVisitSubtitle(v) }}</small>
          </span>
          <app-badge [status]="v.status"></app-badge>
        </button>

        <button
          *ngIf="v.status === 'Scheduled'"
          class="secondary mini"
          (click)="completeVisit.emit(v)"
        >
          <app-icon name="CheckCircle2" [size]="15"></app-icon>
          Attended
        </button>
      </div>

      <p *ngIf="sortedVisits.length === 0" class="empty">
        No appointments for this period.
      </p>
    </section>
  `
})
export class AppointmentsPageComponent {
  @Input() clinic: Clinic | null = null;
  @Output() editVisit = new EventEmitter<Visit>();
  @Output() completeVisit = new EventEmitter<Visit>();

  filterDate = '';

  get sortedVisits(): Visit[] {
    if (!this.clinic) return [];
    return this.clinic.visits
      .filter(v => !this.filterDate || this.filterDate === v.date)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  getPatientName(patientId: string): string {
    return this.clinic?.patients.find(p => p.id === patientId)?.name || 'Unknown Patient';
  }

  formatVisitSubtitle(v: Visit): string {
    if (!this.clinic) return '';
    const pkg = this.clinic.assigned.find(a => a.id === v.pp);
    const dateFormatted = pretty(v.date);
    const packagePart = pkg
      ? `${pkg.name} · ${left(this.clinic, pkg)} left`
      : `Walk-in${v.fee ? ` · ${money(v.fee)}` : ''}`;
    return `${dateFormatted} · ${v.time} · ${packagePart}`;
  }
}

