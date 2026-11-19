import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import {
  Clinic,
  Patient,
  day,
  money,
  balance,
  attention
} from '../../models/clinic.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  private sub?: Subscription;

  constructor(
    private clinicService: ClinicService,
    private dialogService: DialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.clinicService.clinic$.subscribe(c => {
      this.clinic = c;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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

  viewPatient(p: Patient): void {
    this.dialogService.viewPatient(p);
  }

  openModal(mode: string): void {
    this.dialogService.open(mode as any);
  }

  goToPatients(): void {
    this.router.navigate(['/patients']);
  }

  goToReports(): void {
    this.router.navigate(['/reports']);
  }

  goToBackup(): void {
    this.router.navigate(['/backup']);
  }
}
