import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ClinicService } from '../../services/clinic.service';
import { DialogService, DialogState } from '../../services/dialog.service';
import {
  Clinic,
  Patient,
  Visit,
  Pkg,
  Payment,
  Assigned,
  day,
  pretty,
  money
} from '../../models/clinic.model';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
  menuOpen = false;
  currentRoute = 'dashboard';
  notice = '';
  dialogState: DialogState = { mode: '', back: '' };

  private subs = new Subscription();

  navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Patients', path: '/patients', icon: 'UsersRound' },
    { label: 'Appointments', path: '/appointments', icon: 'CalendarDays' },
    { label: 'Packages', path: '/packages', icon: 'Package' },
    { label: 'Payments', path: '/payments', icon: 'IndianRupee' },
    { label: 'Reports', path: '/reports', icon: 'FileBarChart' },
    { label: 'Backup & restore', path: '/backup', icon: 'DatabaseBackup' }
  ];

  topActionMap: Record<string, [string, string]> = {
    dashboard: ['add', 'Add patient'],
    patients: ['add', 'Add patient'],
    appointments: ['book', 'Book appointment'],
    packages: ['pkg', 'Add package'],
    payments: ['pay', 'Record payment']
  };

  constructor(
    private authService: AuthService,
    private clinicService: ClinicService,
    private dialogService: DialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateRoute(this.router.url);

    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => {
          this.updateRoute(e.urlAfterRedirects || e.url);
        })
    );

    this.subs.add(
      this.clinicService.clinic$.subscribe(data => {
        this.clinic = data;
      })
    );

    this.subs.add(
      this.dialogService.state$.subscribe(state => {
        this.dialogState = state;
      })
    );

    this.subs.add(
      this.dialogService.notice$.subscribe(notice => {
        this.notice = notice;
      })
    );

    this.clinicService.load().catch(() => {
      this.dialogService.showNotice(
        'Local storage is unavailable. Enable browser storage before entering records.'
      );
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private updateRoute(url: string): void {
    const clean = url.split('?')[0].replace(/^\//, '').toLowerCase();
    this.currentRoute = clean || 'dashboard';
  }

  get pageTitle(): string {
    switch (this.currentRoute) {
      case 'dashboard':
        return 'Dashboard';
      case 'patients':
        return 'Patients';
      case 'appointments':
        return 'Appointments';
      case 'packages':
        return 'Packages';
      case 'payments':
        return 'Payments';
      case 'reports':
        return 'Reports';
      case 'backup':
        return 'Backup & restore';
      default:
        return 'Workspace';
    }
  }

  get currentDateFormatted(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get currentTopAction(): [string, string] | undefined {
    return this.topActionMap[this.currentRoute];
  }

  triggerTopAction(): void {
    if (!this.currentTopAction) return;
    const mode = this.currentTopAction[0];
    this.dialogService.open(mode as any);
  }

  get isWideModal(): boolean {
    const m = this.dialogState.mode;
    return m === 'view' || m === 'book' || m === 'assign';
  }

  get modalTitle(): string {
    switch (this.dialogState.mode) {
      case 'add':
        return 'Add patient';
      case 'edit':
        return 'Edit patient';
      case 'view':
        return 'Patient record';
      case 'book':
        return this.dialogState.visit ? 'Appointment details' : 'Book appointment';
      case 'pkg':
        return this.dialogState.pkg ? 'Edit package' : 'Add package';
      case 'pay':
        return this.dialogState.payment ? 'Payment details' : 'Record payment';
      case 'assign':
        return 'Assign package';
      case 'confirm':
        return this.dialogState.askConfirm?.title || 'Confirm';
      case 'reset':
        return 'Clear this workspace?';
      case 'restore':
        return 'Restore this backup?';
      default:
        return '';
    }
  }

  closeModal(): void {
    this.dialogService.close();
  }

  logout(): void {
    this.authService.logout();
    this.closeModal();
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }

  openAddPatient(): void {
    this.dialogService.open('add');
  }

  openEditPatient(): void {
    if (this.dialogState.patient) {
      this.dialogService.open('edit', '', { patient: this.dialogState.patient });
    }
  }

  openBookSession(): void {
    if (this.dialogState.patient) {
      this.dialogService.open('book', 'view', { patient: this.dialogState.patient });
    }
  }

  openAssignPackage(): void {
    if (this.dialogState.patient) {
      this.dialogService.open('assign', 'view', { patient: this.dialogState.patient });
    }
  }

  onEditVisit(v: Visit, from = ''): void {
    this.dialogService.open('book', from, { visit: v, patient: this.dialogState.patient });
  }

  onPatientViewPayment(p?: Payment): void {
    if (p) {
      this.dialogService.open('pay', 'view', { payment: p, patient: this.dialogState.patient });
    } else {
      this.dialogService.open('pay', 'view', { patient: this.dialogState.patient });
    }
  }

  async onSavePatient(p: Patient): Promise<void> {
    const res = await this.clinicService.savePatient(p);
    this.dialogService.showNotice(res.message);
    if (this.dialogState.mode === 'edit') {
      this.dialogService.viewPatient(p);
    } else {
      this.closeModal();
    }
  }

  async onSaveVisit(data: { visit: Visit; payment?: { amount: number; mode: string } }): Promise<void> {
    const res = await this.clinicService.saveVisit(data.visit, data.payment);
    this.dialogService.showNotice(res.message);
    if (this.dialogState.back === 'view' && this.dialogState.patient) {
      this.dialogService.viewPatient(this.dialogState.patient);
    } else {
      this.closeModal();
    }
  }

  onRemoveVisit(v: Visit): void {
    const text =
      v.status === 'Completed' && v.pp
        ? 'This session was already counted, so deleting it gives one session back on the package.'
        : 'This appointment will be removed.';
    this.dialogService.confirm({
      title: 'Delete this appointment?',
      text,
      label: 'Delete appointment',
      run: async () => {
        const res = await this.clinicService.removeVisit(v);
        this.dialogService.showNotice(res.message);
        if (this.dialogState.back === 'view' && this.dialogState.patient) {
          this.dialogService.viewPatient(this.dialogState.patient);
        } else {
          this.closeModal();
        }
      }
    });
  }

  async onSavePackage(pkg: Pkg): Promise<void> {
    const res = await this.clinicService.savePackage(pkg);
    this.dialogService.showNotice(res.message);
    this.closeModal();
  }

  onConfirmDeletePackage(pkg: Pkg): void {
    this.dialogService.confirm({
      title: 'Delete this package?',
      text: `${pkg.name} will be removed from the master list. Patients who already bought it keep their sessions and history. You can also set it to Inactive instead.`,
      label: 'Delete package',
      run: async () => {
        const res = await this.clinicService.deletePackage(pkg);
        this.dialogService.showNotice(res.message);
        this.closeModal();
      }
    });
  }

  async onSavePayment(p: Payment): Promise<void> {
    const res = await this.clinicService.savePayment(p);
    this.dialogService.showNotice(res.message);
    if (this.dialogState.back === 'view' && this.dialogState.patient) {
      this.dialogService.viewPatient(this.dialogState.patient);
    } else {
      this.closeModal();
    }
  }

  onConfirmDeletePayment(p: Payment): void {
    this.dialogService.confirm({
      title: 'Delete this payment?',
      text: `${p.id} · ${money(p.amount)} on ${pretty(p.date)} will be removed and the patient's balance will change.`,
      label: 'Delete payment',
      run: async () => {
        const res = await this.clinicService.removePayment(p);
        this.dialogService.showNotice(res.message);
        if (this.dialogState.back === 'view' && this.dialogState.patient) {
          this.dialogService.viewPatient(this.dialogState.patient);
        } else {
          this.closeModal();
        }
      }
    });
  }

  onPrintReceipt(p: Payment): void {
    const ok = this.clinicService.printReceipt(p);
    if (!ok) {
      this.dialogService.showNotice('Allow pop-ups to print the receipt.');
    }
  }

  onConfirmRemoveAssigned(a: Assigned): void {
    this.dialogService.confirm({
      title: 'Remove this package?',
      text: `${a.name} will be removed from the patient. Payments already recorded stay as general payments. Scheduled appointments on it become walk-in visits.`,
      label: 'Remove package',
      run: async () => {
        const res = await this.clinicService.removeAssignedPackage(a);
        this.dialogService.showNotice(res.message);
        if (this.dialogState.patient) {
          this.dialogService.viewPatient(this.dialogState.patient);
        }
      }
    });
  }

  async onAssignPackage(event: { assigned: Assigned; payment?: { amount: number; mode: string } }): Promise<void> {
    const res = await this.clinicService.assignPackage(event.assigned, event.payment);
    this.dialogService.showNotice(res.message);
    if (this.dialogState.patient) {
      this.dialogService.viewPatient(this.dialogState.patient);
    }
  }

  goToPackagesFromModal(): void {
    this.closeModal();
    this.router.navigate(['/packages']);
  }

  onDownloadPatientReport(): void {
    if (this.clinic && this.dialogState.patient) {
      import('../../models/clinic.model').then(m => {
        m.report(this.clinic!, 'Patient register', this.dialogState.patient!.id);
      });
    }
  }

  async onClearWorkspace(): Promise<void> {
    await this.clinicService.clearWorkspace();
    this.dialogService.showNotice('Your empty workspace is ready.');
    this.closeModal();
  }

  async onConfirmRestore(): Promise<void> {
    if (this.dialogState.restoreCandidate) {
      await this.clinicService.save(this.dialogState.restoreCandidate);
      this.dialogService.showNotice('Backup restored.');
      this.closeModal();
    }
  }
}
