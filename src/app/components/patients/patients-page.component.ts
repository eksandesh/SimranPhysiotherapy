import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Clinic, Patient } from '../../models/clinic.model';

@Component({
  selector: 'app-patients-page',
  template: `
    <div class="toolbar">
      <label class="search">
        <app-icon name="Search" [size]="17"></app-icon>
        <input
          aria-label="Search patient records"
          placeholder="Search name, ID or condition"
          [(ngModel)]="query"
        />
      </label>
      <select aria-label="Filter patient status" [(ngModel)]="filter">
        <option *ngFor="let opt of statusOptions" [value]="opt">{{ opt }}</option>
      </select>
    </div>

    <app-patient-list
      [clinic]="clinic"
      [patients]="filteredPatients"
      [showMore]="false"
      (pick)="pickPatient.emit($event)"
    ></app-patient-list>
  `
})
export class PatientsPageComponent {
  @Input() clinic: Clinic | null = null;
  @Output() pickPatient = new EventEmitter<Patient>();

  query = '';
  filter = 'All patients';
  statusOptions = ['All patients', 'Active', 'Follow-up', 'Recovered'];

  get filteredPatients(): Patient[] {
    if (!this.clinic) return [];
    const q = this.query.trim().toLowerCase();
    return this.clinic.patients.filter(p => {
      const matchesFilter = this.filter === 'All patients' || p.status === this.filter;
      const matchesQuery = !q || [p.name, p.id, p.condition].join(' ').toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }
}

