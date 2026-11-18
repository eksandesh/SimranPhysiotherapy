import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ClinicService } from '../../services/clinic.service';
import {
  Clinic,
  Patient,
  Visit,
  Pkg,
  Payment,
  Assigned,
  AskConfirm,
  day,
  pretty,
  money
} from '../../models/clinic.model';

@Component({
  selector: 'app-workspace',
  template: `
    <!-- If not authenticated, show Login -->
    <app-login
      *ngIf="!isAuthenticated"
      (loginSuccess)="onLoginSuccess()"
    ></app-login>

    <!-- If authenticated, show Workspace -->
    <div class="workspace" *ngIf="isAuthenticated">
      <!-- Mobile shade backdrop -->
      <button
        *ngIf="menuOpen"
        aria-label="Close navigation"
        class="shade"
        (click)="menuOpen = false"
      ></button>

      <!-- Sidebar -->
      <aside [class.sidebar]="true" [class.shown]="menuOpen">
        <div class="brand">
          <img src="assets/clinic-icon.svg" alt="Clinic logo" />
          <div>
            <b>Simran</b>
            <span>Physiotherapy</span>
          </div>
        </div>

        <div class="navblock">
          <div class="eyebrow">WORKSPACE</div>
          <nav>
            <button
              *ngFor="let item of navItems.slice(0, 6)"
              [attr.aria-current]="currentPage === item.label ? 'page' : null"
              (click)="goToPage(item.label)"
            >
              <app-icon [name]="item.icon" [size]="18"></app-icon>
              {{ item.label }}
            </button>
          </nav>

          <div class="divider"></div>

          <div class="eyebrow">SYSTEM</div>
          <nav>
            <button
              [attr.aria-current]="currentPage === navItems[6].label ? 'page' : null"
              (click)="goToPage(navItems[6].label)"
            >
              <app-icon [name]="navItems[6].icon" [size]="18"></app-icon>
              {{ navItems[6].label }}
            </button>
          </nav>
        </div>

        <div class="sidebottom">
          <div class="device">
            <span class="statusdot"></span> Local workspace
          </div>
          <div class="profile">
            <span>DS</span>
            <div>
              <b>Dr. Simran</b>
              <small>Clinic administrator</small>
            </div>
            <button
              class="logout"
              aria-label="Sign out"
              title="Sign out"
              (click)="logout()"
            >
              <app-icon name="LogOut" [size]="18"></app-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main>
        <header>
          <div class="bread">
            <button
              class="mobilemenu"
              aria-label="Open navigation"
              (click)="menuOpen = true"
            >
              <app-icon name="Menu" [size]="20"></app-icon>
            </button>
            <app-icon name="PanelLeft" [size]="17" className="desktopicon"></app-icon>
            <span class="crumbline"></span>
            Workspace
            <app-icon name="ChevronRight" [size]="13"></app-icon>
            <b>{{ currentPage }}</b>
          </div>

          <span class="headerdate">
            <app-icon name="CalendarDays" [size]="15"></app-icon>
            {{ currentDateFormatted }}
          </span>
        </header>

        <div class="content">
          <div class="pagetop">
            <div>
              <div class="eyebrow">CLINIC WORKSPACE</div>
              <h1>{{ currentPage }}</h1>
            </div>

            <button
              *ngIf="clinic && currentTopAction"
              class="primary"
              (click)="openModal(currentTopAction[0])"
            >
              <app-icon name="Plus" [size]="17"></app-icon>
              {{ currentTopAction[1] }}
            </button>
          </div>

          <!-- Loading state -->
          <p *ngIf="!clinic">{{ notice || 'Opening local workspace…' }}</p>

          <!-- Pages -->
          <ng-container *ngIf="clinic">
            <!-- Dashboard / Overview -->
            <app-overview
              *ngIf="currentPage === 'Dashboard'"
              [clinic]="clinic"
              (navigate)="goToPage($event)"
              (openModal)="openModal($event)"
              (pickPatient)="viewPatient($event)"
            ></app-overview>

            <!-- Patients -->
            <app-patients-page
              *ngIf="currentPage === 'Patients'"
              [clinic]="clinic"
              (pickPatient)="viewPatient($event)"
            ></app-patients-page>

            <!-- Appointments -->
            <app-appointments-page
              *ngIf="currentPage === 'Appointments'"
              [clinic]="clinic"
              (editVisit)="onEditVisit($event)"
              (completeVisit)="onCompleteVisit($event)"
            ></app-appointments-page>

            <!-- Packages -->
            <app-packages-page
              *ngIf="currentPage === 'Packages'"
              [clinic]="clinic"
              (pickPackage)="onPickPackage($event)"
            ></app-packages-page>

            <!-- Payments -->
            <app-payments-page
              *ngIf="currentPage === 'Payments'"
              [clinic]="clinic"
              (editPayment)="onEditPayment($event)"
              (viewPatient)="viewPatient($event)"
            ></app-payments-page>

            <!-- Reports -->
            <app-reports-page
              *ngIf="currentPage === 'Reports'"
              [clinic]="clinic"
              (notify)="showNotice($event)"
            ></app-reports-page>

            <!-- Backup & restore -->
            <app-backup-page
              *ngIf="currentPage === 'Backup & restore'"
              [clinic]="clinic"
              [isOfflineReady]="isOfflineReady"
              (notify)="showNotice($event)"
              (restoreBackup)="onRestoreBackup($event)"
              (resetWorkspace)="openModal('reset')"
            ></app-backup-page>
          </ng-container>
        </div>
      </main>

      <!-- Toast notice -->
      <div *ngIf="notice" role="status" class="toast">
        {{ notice }}
      </div>

      <!-- Modals / Dialogs -->
      <app-dialog
        *ngIf="clinic && modalMode"
        [title]="modalTitle"
        [wide]="isWideModal"
        (close)="closeModal()"
      >
        <!-- Add / Edit Patient -->
        <app-patient-form
          *ngIf="modalMode === 'add' || modalMode === 'edit'"
          [patient]="modalMode === 'edit' ? selectedPatient : undefined"
          (commit)="onSavePatient($event)"
        ></app-patient-form>

        <!-- Book / Edit Appointment -->
        <ng-container *ngIf="modalMode === 'book'">
          <div *ngIf="clinic.patients.length === 0">
            <p>Add a patient before booking an appointment.</p>
            <button class="primary" (click)="openModal('add')">Add patient</button>
          </div>
          <app-visit-form
            *ngIf="clinic.patients.length > 0"
            [clinic]="clinic"
            [visitData]="selectedVisit"
            [fixedPatientId]="modalBack === 'view' ? selectedPatient?.id : ''"
            (commit)="onSaveVisit($event)"
            (deleteVisit)="onRemoveVisit($event)"
          ></app-visit-form>
        </ng-container>

        <!-- Add / Edit Package -->
        <app-package-form
          *ngIf="modalMode === 'pkg'"
          [packageData]="selectedPkg"
          (commit)="onSavePackage($event)"
          (deletePackage)="onConfirmDeletePackage($event)"
        ></app-package-form>

        <!-- Record / Edit Payment -->
        <ng-container *ngIf="modalMode === 'pay'">
          <div *ngIf="clinic.patients.length === 0">
            <p>Add a patient before recording a payment.</p>
          </div>
          <app-payment-form
            *ngIf="clinic.patients.length > 0"
            [clinic]="clinic"
            [paymentData]="selectedPayment"
            [fixedPatientId]="modalBack === 'view' ? selectedPatient?.id : ''"
            (commit)="onSavePayment($event)"
            (deletePayment)="onConfirmDeletePayment($event)"
            (printReceipt)="onPrintReceipt($event)"
          ></app-payment-form>
        </ng-container>

        <!-- Assign Package to Patient -->
        <app-assign-form
          *ngIf="modalMode === 'assign' && selectedPatient"
          [clinic]="clinic"
          [patientId]="selectedPatient.id"
          (commit)="onAssignPackage($event)"
          (goPackages)="goToPackagesFromModal()"
        ></app-assign-form>

        <!-- Confirmation Ask Dialog -->
        <ng-container *ngIf="modalMode === 'confirm' && askConfirm">
          <p>{{ askConfirm.text }}</p>
          <button class="primary danger" (click)="askConfirm.run()">
            {{ askConfirm.label }}
          </button>
        </ng-container>

        <!-- Patient Detail Record View -->
        <app-patient-detail
          *ngIf="modalMode === 'view' && selectedPatient"
          [clinic]="clinic"
          [patient]="selectedPatient"
          (assignPackage)="openModal('assign', 'view')"
          (editPayment)="onPatientViewPayment($event)"
          (removePackage)="onConfirmRemoveAssigned($event)"
          (editVisit)="onEditVisit($event, 'view')"
          (bookSession)="openModal('book', 'view')"
          (editPatient)="openModal('edit')"
          (downloadReport)="onDownloadPatientReport()"
        ></app-patient-detail>

        <!-- Reset Workspace Dialog -->
        <ng-container *ngIf="modalMode === 'reset'">
          <p>
            All {{ clinic.patients.length }} patient records and
            {{ clinic.visits.length }} appointments will be removed. Download a
            backup first if you need to keep them.
          </p>
          <button class="primary" (click)="onClearWorkspace()">
            Clear records and start fresh
          </button>
        </ng-container>

        <!-- Restore Backup Confirmation Dialog -->
        <ng-container *ngIf="modalMode === 'restore' && restoreCandidate">
          <p>
            Replace all current records with
            {{ restoreCandidate.patients.length }} patients,
            {{ restoreCandidate.visits.length }} appointments,
            {{ restoreCandidate.packages.length }} packages and
            {{ restoreCandidate.payments.length }} payments from the backup?
          </p>
          <button class="primary" (click)="onConfirmRestore()">
            Replace and restore
          </button>
        </ng-container>
      </app-dialog>
    </div>
  `
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  clinic: Clinic | null = null;
  currentPage = 'Dashboard';
  menuOpen = false;

  modalMode = '';
  modalBack = '';
  selectedPatient?: Patient;
  selectedVisit?: Visit;
  selectedPkg?: Pkg;
  selectedPayment?: Payment;
  askConfirm?: AskConfirm;
  restoreCandidate?: Clinic;

  notice = '';
  noticeTimeout: any;
  isOfflineReady = false;

  private authSub?: Subscription;
  private clinicSub?: Subscription;

  navItems = [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Patients', icon: 'UsersRound' },
    { label: 'Appointments', icon: 'CalendarDays' },
    { label: 'Packages', icon: 'Package' },
    { label: 'Payments', icon: 'IndianRupee' },
    { label: 'Reports', icon: 'FileBarChart' },
    { label: 'Backup & restore', icon: 'DatabaseBackup' }
  ];

  topActionMap: Record<string, [string, string]> = {
    Dashboard: ['add', 'Add patient'],
    Patients: ['add', 'Add patient'],
    Appointments: ['book', 'Book appointment'],
    Packages: ['pkg', 'Add package'],
    Payments: ['pay', 'Record payment']
  };

  constructor(
    private authService: AuthService,
    private clinicService: ClinicService
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.authed$.subscribe(authed => {
      this.isAuthenticated = authed;
      if (authed) {
        this.loadClinicData();
      } else {
        this.clinic = null;
      }
    });

    this.clinicSub = this.clinicService.clinic$.subscribe(data => {
      this.clinic = data;
    });

    this.initServiceWorker();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.clinicSub?.unsubscribe();
    if (this.noticeTimeout) {
      clearTimeout(this.noticeTimeout);
    }
  }

  private initServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then(reg => {
          const channel = new MessageChannel();
          channel.port1.onmessage = e => {
            this.isOfflineReady = e.data === true;
          };
          reg.active?.postMessage(
            {
              type: 'CACHE_SHELL',
              urls: [
                ...new Set([
                  ...performance.getEntriesByType('resource').map(r => r.name),
                  ...Array.from(document.scripts, s => s.src)
                ].filter(Boolean))
              ]
            },
            [channel.port2]
          );
        })
        .catch(() => {
          this.isOfflineReady = false;
        });
    }
  }

  private async loadClinicData(): Promise<void> {
    try {
      await this.clinicService.load();
    } catch {
      this.showNotice(
        'Local storage is unavailable. Enable browser storage before entering records.'
      );
    }
  }

  onLoginSuccess(): void {
    this.loadClinicData();
  }

  logout(): void {
    this.authService.logout();
    this.modalMode = '';
    this.menuOpen = false;
    this.currentPage = 'Dashboard';
  }

  goToPage(page: string): void {
    this.currentPage = page;
    this.menuOpen = false;
    window.scrollTo(0, 0);
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
    return this.topActionMap[this.currentPage];
  }

  get isWideModal(): boolean {
    return (
      this.modalMode === 'view' ||
      this.modalMode === 'book' ||
      this.modalMode === 'assign'
    );
  }

  get modalTitle(): string {
    switch (this.modalMode) {
      case 'add':
        return 'Add patient';
      case 'edit':
        return 'Edit patient';
      case 'view':
        return 'Patient record';
      case 'book':
        return this.selectedVisit ? 'Appointment details' : 'Book appointment';
      case 'pkg':
        return this.selectedPkg ? 'Edit package' : 'Add package';
      case 'pay':
        return this.selectedPayment ? 'Payment details' : 'Record payment';
      case 'assign':
        return 'Assign package';
      case 'confirm':
        return this.askConfirm?.title || 'Confirm';
      case 'reset':
        return 'Clear this workspace?';
      case 'restore':
        return 'Restore this backup?';
      default:
        return '';
    }
  }

  showNotice(msg: string): void {
    this.notice = msg;
    if (this.noticeTimeout) clearTimeout(this.noticeTimeout);
    this.noticeTimeout = setTimeout(() => {
      this.notice = '';
    }, 6500);
  }

  openModal(mode: string, from = ''): void {
    if (mode === 'book') this.selectedVisit = undefined;
    if (mode === 'pkg') this.selectedPkg = undefined;
    if (mode === 'pay') this.selectedPayment = undefined;
    this.modalBack = from;
    this.modalMode = mode;
  }

  closeModal(): void {
    this.modalMode = '';
    this.modalBack = '';
  }

  viewPatient(p: Patient): void {
    this.selectedPatient = p;
    this.modalBack = '';
    this.modalMode = 'view';
  }

  onEditVisit(v: Visit, from = ''): void {
    this.selectedVisit = v;
    this.modalBack = from;
    this.modalMode = 'book';
  }

  onEditPayment(p: Payment, from = ''): void {
    this.selectedPayment = p;
    this.modalBack = from;
    this.modalMode = 'pay';
  }

  onPickPackage(pkg: Pkg): void {
    this.selectedPkg = pkg;
    this.modalBack = '';
    this.modalMode = 'pkg';
  }

  async onSavePatient(p: Patient): Promise<void> {
    const res = await this.clinicService.savePatient(p);
    this.showNotice(res.message);
    if (this.modalMode === 'edit') {
      this.selectedPatient = p;
      this.modalMode = 'view';
    } else {
      this.closeModal();
    }
  }

  async onSaveVisit(data: { visit: Visit; payment?: { amount: number; mode: string } }): Promise<void> {
    const res = await this.clinicService.saveVisit(data.visit, data.payment);
    this.showNotice(res.message);
    this.modalMode = this.modalBack === 'view' ? 'view' : '';
    this.modalBack = '';
  }

  async onCompleteVisit(v: Visit): Promise<void> {
    const res = await this.clinicService.completeVisit(v);
    if (res.requiresEdit) {
      this.onEditVisit({ ...v, status: 'Completed' });
    } else {
      this.showNotice(res.message);
    }
  }

  onRemoveVisit(v: Visit): void {
    const text =
      v.status === 'Completed' && v.pp
        ? 'This session was already counted, so deleting it gives one session back on the package.'
        : 'This appointment will be removed.';
    this.askConfirm = {
      title: 'Delete this appointment?',
      text,
      label: 'Delete appointment',
      run: async () => {
        const res = await this.clinicService.removeVisit(v);
        this.showNotice(res.message);
        this.modalMode = this.modalBack === 'view' ? 'view' : '';
        this.modalBack = '';
      }
    };
    this.modalMode = 'confirm';
  }

  async onSavePackage(pkg: Pkg): Promise<void> {
    const res = await this.clinicService.savePackage(pkg);
    this.showNotice(res.message);
    this.closeModal();
  }

  onConfirmDeletePackage(pkg: Pkg): void {
    this.askConfirm = {
      title: 'Delete this package?',
      text: `${pkg.name} will be removed from the master list. Patients who already bought it keep their sessions and history. You can also set it to Inactive instead.`,
      label: 'Delete package',
      run: async () => {
        const res = await this.clinicService.deletePackage(pkg);
        this.showNotice(res.message);
        this.closeModal();
      }
    };
    this.modalMode = 'confirm';
  }

  async onSavePayment(p: Payment): Promise<void> {
    const res = await this.clinicService.savePayment(p);
    this.showNotice(res.message);
    this.modalMode = this.modalBack === 'view' ? 'view' : '';
    this.modalBack = '';
  }

  onConfirmDeletePayment(p: Payment): void {
    this.askConfirm = {
      title: 'Delete this payment?',
      text: `${p.id} · ${money(p.amount)} on ${pretty(p.date)} will be removed and the patient's balance will change.`,
      label: 'Delete payment',
      run: async () => {
        const res = await this.clinicService.removePayment(p);
        this.showNotice(res.message);
        this.modalMode = this.modalBack === 'view' ? 'view' : '';
        this.modalBack = '';
      }
    };
    this.modalMode = 'confirm';
  }

  onPrintReceipt(p: Payment): void {
    const ok = this.clinicService.printReceipt(p);
    if (!ok) {
      this.showNotice('Allow pop-ups to print the receipt.');
    }
  }

  onPatientViewPayment(p?: Payment): void {
    if (p) {
      this.onEditPayment(p, 'view');
    } else {
      this.openModal('pay', 'view');
    }
  }

  onConfirmRemoveAssigned(a: Assigned): void {
    this.askConfirm = {
      title: 'Remove this package?',
      text: `${a.name} will be removed from the patient. Payments already recorded stay as general payments. Scheduled appointments on it become walk-in visits.`,
      label: 'Remove package',
      run: async () => {
        const res = await this.clinicService.removeAssignedPackage(a);
        this.showNotice(res.message);
        this.modalMode = 'view';
      }
    };
    this.modalMode = 'confirm';
  }

  async onAssignPackage(event: { assigned: Assigned; payment?: { amount: number; mode: string } }): Promise<void> {
    const res = await this.clinicService.assignPackage(event.assigned, event.payment);
    this.showNotice(res.message);
    this.modalMode = 'view';
  }

  goToPackagesFromModal(): void {
    this.closeModal();
    this.goToPage('Packages');
  }

  onDownloadPatientReport(): void {
    if (this.clinic && this.selectedPatient) {
      import('../../models/clinic.model').then(m => {
        m.report(this.clinic!, 'Patient register', this.selectedPatient!.id);
      });
    }
  }

  async onClearWorkspace(): Promise<void> {
    await this.clinicService.clearWorkspace();
    this.showNotice('Your empty workspace is ready.');
    this.closeModal();
  }

  onRestoreBackup(restored: Clinic): void {
    this.restoreCandidate = restored;
    this.modalMode = 'restore';
  }

  async onConfirmRestore(): Promise<void> {
    if (this.restoreCandidate) {
      await this.clinicService.save(this.restoreCandidate);
      this.showNotice('Backup restored.');
      this.closeModal();
    }
  }
}

