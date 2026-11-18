import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnInit } from '@angular/core';
import {
  Clinic,
  report,
  download,
  day,
  pretty,
  valid,
  migrate
} from '../../models/clinic.model';

@Component({
  selector: 'app-reports-page',
  template: `
    <section class="panel toolpanel" *ngIf="clinic">
      <span class="iconbox tint0">
        <app-icon name="FileText" [size]="20"></app-icon>
      </span>
      <h2>Download a clinic report</h2>
      <p>Export a spreadsheet from the records saved on this device.</p>

      <div class="fields">
        <label>
          Report type
          <select [(ngModel)]="selectedKind">
            <option *ngFor="let k of reportTypes" [value]="k">{{ k }}</option>
          </select>
        </label>
        <label>
          Patient
          <select [(ngModel)]="selectedPatientId">
            <option value="">All patients</option>
            <option *ngFor="let p of clinic.patients" [value]="p.id">
              {{ p.name }} · {{ p.id }}
            </option>
          </select>
        </label>
      </div>

      <button class="primary formend" (click)="downloadCsv()">
        <app-icon name="Download" [size]="16"></app-icon>
        Download CSV
      </button>
    </section>
  `
})
export class ReportsPageComponent {
  @Input() clinic: Clinic | null = null;
  @Output() notify = new EventEmitter<string>();

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

  downloadCsv() {
    if (!this.clinic) return;
    report(this.clinic, this.selectedKind, this.selectedPatientId);
    this.notify.emit('CSV report downloaded.');
  }
}

@Component({
  selector: 'app-backup-page',
  template: `
    <div class="backupgrid" *ngIf="clinic">
      <!-- Device backup -->
      <section class="panel toolpanel">
        <span class="iconbox tint0">
          <app-icon name="HardDrive" [size]="20"></app-icon>
        </span>
        <h2>Device backup</h2>
        <p>
          Save a complete copy of patient records, clinical notes, appointments,
          packages and payments. Backups contain private patient information;
          store them securely.
        </p>
        <button class="primary" (click)="onDownloadBackup()">
          <app-icon name="Download" [size]="16"></app-icon>
          Download backup
        </button>
        <small style="margin-top: 10px;">{{ lastBackupInfo }}</small>
      </section>

      <!-- Restore records -->
      <section class="panel toolpanel">
        <span class="iconbox tint1">
          <app-icon name="Upload" [size]="20"></app-icon>
        </span>
        <h2>Restore records</h2>
        <p>
          Choose a Simran Physiotherapy backup from this or another device.
          Older backups (before packages and payments) work too. You can review
          record counts before replacing your workspace.
        </p>
        <button class="secondary" (click)="fileInput.click()">
          Choose backup file
        </button>
        <input
          #fileInput
          type="file"
          hidden
          accept=".json,application/json"
          (change)="onFileSelected($event)"
        />
      </section>

      <!-- Offline access -->
      <section class="panel toolpanel">
        <app-icon name="ShieldCheck" [size]="24"></app-icon>
        <h2>Offline access</h2>
        <p>
          {{ isOfflineReady ? 'This workspace is cached for offline use.' : 'Open this workspace online once in a supported browser to prepare offline access.' }}
          Use the same browser and a locked, encrypted device. Clearing site
          data removes local records.
        </p>
      </section>

      <!-- Sample workspace reset -->
      <section *ngIf="clinic.demo" class="panel toolpanel">
        <app-icon name="Stethoscope" [size]="24"></app-icon>
        <h2>Sample workspace</h2>
        <p>
          Start with an empty register before entering real patient
          information. This removes all records currently on this device,
          including sample packages and payments.
        </p>
        <button class="secondary" (click)="resetWorkspace.emit()">
          Start a clean workspace
        </button>
      </section>
    </div>
  `
})
export class BackupPageComponent implements OnInit {
  @Input() clinic: Clinic | null = null;
  @Input() isOfflineReady = false;
  @Output() notify = new EventEmitter<string>();
  @Output() restoreBackup = new EventEmitter<Clinic>();
  @Output() resetWorkspace = new EventEmitter<void>();

  lastBackupDate = '';

  ngOnInit() {
    try {
      this.lastBackupDate = localStorage.getItem('simran-last-backup') || '';
    } catch {
      this.lastBackupDate = '';
    }
  }

  get lastBackupInfo(): string {
    if (!this.lastBackupDate) {
      return 'No backup downloaded from this device yet.';
    }
    return `Last backup: ${pretty(this.lastBackupDate)}`;
  }

  onDownloadBackup() {
    if (!this.clinic) return;
    const backupJson = JSON.stringify(this.clinic, null, 2);
    const filename = `Simran-backup-${day()}.json`;
    download(filename, backupJson, 'application/json');

    try {
      localStorage.setItem('simran-last-backup', day());
      this.lastBackupDate = day();
    } catch {}

    this.notify.emit('Device backup downloaded.');
  }

  async onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!valid(parsed)) {
        throw new Error('Invalid format');
      }
      const migrated = migrate(parsed);
      this.restoreBackup.emit(migrated);
    } catch {
      this.notify.emit('This file is not a valid clinic backup.');
    }
  }
}

