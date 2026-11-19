import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import {
  Clinic,
  download,
  day,
  pretty,
  valid,
  migrate
} from '../../models/clinic.model';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  lastBackupDate = '';
  isOfflineReady = false;
  private sub?: Subscription;

  constructor(
    private clinicService: ClinicService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.sub = this.clinicService.clinic$.subscribe(c => {
      this.clinic = c;
    });

    try {
      this.lastBackupDate = localStorage.getItem('simran-last-backup') || '';
    } catch {
      this.lastBackupDate = '';
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        this.isOfflineReady = true;
      }).catch(() => {
        this.isOfflineReady = false;
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get lastBackupInfo(): string {
    if (!this.lastBackupDate) {
      return 'No backup downloaded from this device yet.';
    }
    return `Last backup: ${pretty(this.lastBackupDate)}`;
  }

  onDownloadBackup(): void {
    if (!this.clinic) return;
    const backupJson = JSON.stringify(this.clinic, null, 2);
    const filename = `Simran-backup-${day()}.json`;
    download(filename, backupJson, 'application/json');

    try {
      localStorage.setItem('simran-last-backup', day());
      this.lastBackupDate = day();
    } catch {}

    this.dialogService.showNotice('Device backup downloaded.');
  }

  async onFileSelected(event: any): Promise<void> {
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
      this.dialogService.restore(migrated);
    } catch {
      this.dialogService.showNotice('This file is not a valid clinic backup.');
    }
  }

  resetWorkspace(): void {
    this.dialogService.reset();
  }
}
