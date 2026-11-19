import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import {
  Clinic,
  Visit,
  pretty,
  money,
  left
} from '../../models/clinic.model';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  filterDate = '';
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

  editVisit(v: Visit): void {
    this.dialogService.bookVisit(v);
  }

  async onCompleteVisit(v: Visit): Promise<void> {
    const res = await this.clinicService.completeVisit(v);
    if (res.requiresEdit) {
      this.dialogService.bookVisit({ ...v, status: 'Completed' });
    } else {
      this.dialogService.showNotice(res.message);
    }
  }
}
