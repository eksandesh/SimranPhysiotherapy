import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import { Clinic, Patient } from '../../models/clinic.model';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  query = '';
  filter = 'All patients';
  statusOptions = ['All patients', 'Active', 'Follow-up', 'Recovered'];

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

  get filteredPatients(): Patient[] {
    if (!this.clinic) return [];
    const q = this.query.trim().toLowerCase();
    return this.clinic.patients.filter(p => {
      const matchesFilter = this.filter === 'All patients' || p.status === this.filter;
      const matchesQuery = !q || [p.name, p.id, p.condition].join(' ').toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }

  viewPatient(p: Patient): void {
    this.dialogService.viewPatient(p);
  }
}
