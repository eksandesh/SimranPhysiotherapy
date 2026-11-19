import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import { Clinic, report } from '../../models/clinic.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  reportTypes = [
    'Patient register',
    'Appointment schedule',
    'Completed sessions',
    'Payments',
    'Package balances',
    'Pending dues'
  ];

  selectedKind = 'Patient register';
  selectedPatientId = '';
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

  downloadCsv(): void {
    if (!this.clinic) return;
    report(this.clinic, this.selectedKind, this.selectedPatientId);
    this.dialogService.showNotice('CSV report downloaded.');
  }
}
