import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Clinic,
  Patient,
  day,
  money,
  balance,
  attention
} from '../../models/clinic.model';

@Component({
  selector: 'app-overview',
  template: `
    <div *ngIf="clinic">
      <!-- Hero -->
      <div class="hero">
        <div class="herotext">
          <span class="eyebrow heroeyebrow"><i></i> CLINIC OVERVIEW</span>
          <h1>Welcome back, Dr. Simran</h1>
          <p>Here’s what’s happening at your clinic today.</p>
        </div>
        <img class="heroart" src="assets/therapy.png" alt="Physiotherapy art" />
      </div>

      <!-- Section Title -->
      <div class="sectiontitle">
        <h2>Practice overview</h2>
        <span><i></i> Live overview</span>
      </div>

      <!-- Practice Stats -->
      <div class="statgrid">
        <div class="stat" *ngFor="let s of practiceStats">
          <div class="statline">
            <span>{{ s.label }}</span>
            <em [class]="'iconbox ' + s.colorClass">
              <app-icon [name]="s.icon" [size]="19"></app-icon>
            </em>
          </div>
          <strong>{{ s.value }}</strong>
          <small>{{ s.sub }}</small>
        </div>
      </div>

      <!-- Financial & Package Stats -->
      <div class="statgrid" style="margin-top: 15px;">
        <div class="stat" *ngFor="let s of moneyStats">
          <div class="statline">
            <span>{{ s.label }}</span>
            <em [class]="'iconbox ' + s.colorClass">
              <app-icon [name]="s.icon" [size]="19"></app-icon>
            </em>
          </div>
          <strong>{{ s.value }}</strong>
          <small>{{ s.sub }}</small>
        </div>
      </div>

      <!-- Dashgrid -->
      <div class="dashgrid">
        <app-patient-list
          [clinic]="clinic"
          [patients]="clinic.patients.slice(0, 5)"
          [showMore]="true"
          (pick)="pickPatient.emit($event)"
          (more)="navigate.emit('Patients')"
        ></app-patient-list>

        <div class="rightstack">
          <!-- Quick actions -->
          <section class="panel actions">
            <div class="panelhead">
              <h2>Quick actions</h2>
            </div>
            <button class="act" (click)="openModal.emit('add')">
              <span class="iconbox"><app-icon name="UserRoundPlus" [size]="19"></app-icon></span>
              <span><b>Add patient</b><small>Create a patient record</small></span>
              <app-icon name="ChevronRight" [size]="15"></app-icon>
            </button>
            <button class="act" (click)="openModal.emit('book')">
              <span class="iconbox"><app-icon name="CalendarCheck" [size]="19"></app-icon></span>
              <span><b>Book appointment</b><small>Schedule a clinic visit</small></span>
              <app-icon name="ChevronRight" [size]="15"></app-icon>
            </button>
            <button class="act" (click)="openModal.emit('pay')">
              <span class="iconbox"><app-icon name="IndianRupee" [size]="19"></app-icon></span>
              <span><b>Record payment</b><small>Log an amount received</small></span>
              <app-icon name="ChevronRight" [size]="15"></app-icon>
            </button>
            <button class="act" (click)="navigate.emit('Reports')">
              <span class="iconbox"><app-icon name="FileDown" [size]="19"></app-icon></span>
              <span><b>Download report</b><small>Export your clinic data</small></span>
              <app-icon name="ChevronRight" [size]="15"></app-icon>
            </button>
          </section>

          <!-- Needs attention -->
          <section *ngIf="needsAttention.length > 0" class="panel actions">
            <div class="panelhead">
              <h2>Needs attention</h2>
            </div>
            <button
              class="act"
              *ngFor="let item of needsAttention.slice(0, 5)"
              (click)="pickPatient.emit(item.p)"
            >
              <span class="iconbox tint4">
                <app-icon name="AlertCircle" [size]="19"></app-icon>
              </span>
              <span>
                <b>{{ item.p.name }}</b>
                <small>{{ formatAttentionSubtitle(item) }}</small>
              </span>
              <app-icon name="ChevronRight" [size]="15"></app-icon>
            </button>
          </section>

          <!-- Local storage card -->
          <section class="localcard">
            <div>
              <app-icon name="ShieldCheck" [size]="21"></app-icon>
              <h3>Offline workspace</h3>
            </div>
            <p>Your records stay on this device. No internet connection needed for daily work.</p>
            <button class="link" (click)="navigate.emit('Backup & restore')">
              Manage backups <app-icon name="ArrowRight" [size]="14"></app-icon>
            </button>
          </section>
        </div>
      </div>

      <!-- Footer -->
      <footer>
        <app-icon name="HardDrive" [size]="14"></app-icon>
        Local storage <span>·</span>
        {{ clinic.demo ? 'Sample workspace' : 'Clinic workspace' }}
        <span class="footbrand">Simran Physiotherapy</span>
      </footer>
    </div>
  `
})
export class OverviewComponent {
  @Input() clinic: Clinic | null = null;
  @Output() navigate = new EventEmitter<string>();
  @Output() openModal = new EventEmitter<string>();
  @Output() pickPatient = new EventEmitter<Patient>();

  get today(): string {
    return day();
  }

  get needsAttention() {
    return this.clinic ? attention(this.clinic) : [];
  }

  get practiceStats() {
    if (!this.clinic) return [];
    const t = this.today;
    return [
      {
        label: 'Total patients',
        value: this.clinic.patients.length,
        sub: 'Registered patients',
        icon: 'UsersRound',
        colorClass: 'tint0'
      },
      {
        label: 'Active cases',
        value: this.clinic.patients.filter(p => p.status === 'Active').length,
        sub: 'Ongoing treatment',
        icon: 'Activity',
        colorClass: 'tint1'
      },
      {
        label: 'Today’s appointments',
        value: this.clinic.visits.filter(v => v.date === t && v.status !== 'Cancelled').length,
        sub: 'On the schedule today',
        icon: 'CalendarDays',
        colorClass: 'tint2'
      },
      {
        label: 'Completed sessions',
        value: this.clinic.visits.filter(v => v.status === 'Completed').length,
        sub: 'Total therapy sessions',
        icon: 'ClipboardCheck',
        colorClass: 'tint3'
      }
    ];
  }

  get moneyStats() {
    if (!this.clinic) return [];
    const t = this.today;
    const sumToday = this.clinic.payments
      .filter(p => p.date === t)
      .reduce((s, p) => s + p.amount, 0);

    const monthPrefix = t.slice(0, 7);
    const sumMonth = this.clinic.payments
      .filter(p => p.date.startsWith(monthPrefix))
      .reduce((s, p) => s + p.amount, 0);

    const pendingTotal = this.clinic.patients.reduce(
      (s, p) => s + Math.max(0, balance(this.clinic!, p.id)),
      0
    );
    const oweCount = this.clinic.patients.filter(
      p => balance(this.clinic!, p.id) > 0.004
    ).length;

    const renewCount = this.needsAttention.filter(x => x.renew).length;

    return [
      {
        label: 'Collected today',
        value: money(sumToday),
        sub: 'Payments received today',
        icon: 'IndianRupee',
        colorClass: 'tint0'
      },
      {
        label: 'Collected this month',
        value: money(sumMonth),
        sub: 'Month to date',
        icon: 'Wallet',
        colorClass: 'tint1'
      },
      {
        label: 'Pending dues',
        value: money(pendingTotal),
        sub: `${oweCount} patient(s) owe`,
        icon: 'AlertCircle',
        colorClass: 'tint4'
      },
      {
        label: 'Packages ending',
        value: renewCount,
        sub: '1 or no sessions left',
        icon: 'Hourglass',
        colorClass: 'tint3'
      }
    ];
  }

  formatAttentionSubtitle(item: any): string {
    const parts: string[] = [];
    if (item.renew) {
      parts.push(item.sessions === 0 ? 'No sessions left' : '1 session left');
    }
    if (item.due > 0) {
      parts.push(`${money(item.due)} due`);
    }
    return parts.join(' · ');
  }
}
