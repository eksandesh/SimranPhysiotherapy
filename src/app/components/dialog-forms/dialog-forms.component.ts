import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  Clinic,
  Patient,
  Visit,
  Assigned,
  MODES,
  day,
  pretty,
  money,
  used,
  left
} from '../../models/clinic.model';

@Component({
  selector: 'app-patient-form',
  template: `
    <form (ngSubmit)="submit()">
      <div class="fields">
        <label>
          Full name
          <input
            name="name"
            [(ngModel)]="name"
            autoFocus
            required
            maxlength="100"
          />
        </label>

        <div class="pair">
          <label>
            Age
            <input
              type="number"
              name="age"
              min="0"
              max="125"
              required
              [(ngModel)]="age"
            />
          </label>
          <label>
            Gender
            <select name="gender" [(ngModel)]="gender">
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Not specified">Not specified</option>
            </select>
          </label>
        </div>

        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            maxlength="30"
            [(ngModel)]="phone"
          />
        </label>

        <label>
          Condition
          <input
            name="condition"
            required
            maxlength="150"
            [(ngModel)]="condition"
          />
        </label>

        <label>
          Care status
          <select name="status" [(ngModel)]="status">
            <option value="Active">Active</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Recovered">Recovered</option>
          </select>
        </label>

        <label>
          Clinical notes
          <textarea
            name="notes"
            rows="3"
            [(ngModel)]="notes"
          ></textarea>
        </label>
      </div>

      <button class="primary formend" type="submit">Save patient</button>
    </form>
  `
})
export class PatientFormComponent implements OnInit {
  @Input() patient?: Patient;
  @Output() commit = new EventEmitter<Patient>();

  name = '';
  age = '';
  gender = 'Female';
  phone = '';
  condition = '';
  status = 'Active';
  notes = '';

  ngOnInit() {
    if (this.patient) {
      this.name = this.patient.name;
      this.age = this.patient.age;
      this.gender = this.patient.gender || 'Female';
      this.phone = this.patient.phone || '';
      this.condition = this.patient.condition;
      this.status = this.patient.status || 'Active';
      this.notes = this.patient.notes || '';
    }
  }

  submit() {
    if (!this.name.trim() || !this.condition.trim()) return;

    const saved: Patient = {
      id: this.patient?.id || '',
      name: this.name.trim(),
      age: this.age,
      gender: this.gender,
      phone: this.phone,
      condition: this.condition.trim(),
      status: this.status,
      notes: this.notes,
      date: this.patient?.date || day()
    };

    this.commit.emit(saved);
  }
}

@Component({
  selector: 'app-visit-form',
  template: `
    <form (ngSubmit)="submit()" *ngIf="clinic">
      <div class="fields">
        <label>
          Patient
          <select
            name="patient"
            [(ngModel)]="patientId"
            (ngModelChange)="onPatientChange($event)"
            required
          >
            <option value="" disabled>Select a patient</option>
            <option *ngFor="let p of clinic.patients" [value]="p.id">
              {{ p.name }} · {{ p.id }}
            </option>
          </select>
        </label>

        <label>
          Package
          <select name="pp" [(ngModel)]="pp" (ngModelChange)="err = ''">
            <option value="">Walk-in (pay per visit)</option>
            <option *ngFor="let a of availablePacks" [value]="a.id">
              {{ a.name }} · {{ getRemainingSessions(a) }} left
            </option>
          </select>
        </label>

        <div class="pair">
          <label>
            Date
            <input name="date" type="date" required [(ngModel)]="visitDate" />
          </label>
          <label>
            Time
            <input name="time" type="time" required [(ngModel)]="visitTime" />
          </label>
        </div>

        <label>
          Session status
          <select name="status" [(ngModel)]="sessionStatus" (ngModelChange)="err = ''">
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>

        <!-- Warning when patient has packages but none with remaining sessions -->
        <div *ngIf="!selectedPack && hasAssignedPacks && availablePacks.length === 0" class="calc warn">
          This patient has no sessions left on their package, so this visit will be billed as a walk-in. Assign a new package from the patient record to continue a pack.
        </div>

        <!-- Session calc when package selected -->
        <div *ngIf="selectedPack" class="calc">
          {{ formatSessionInfo() }}
        </div>

        <!-- Walk-in fee input when no package selected -->
        <label *ngIf="!selectedPack">
          Fee for this visit (₹)
          <input
            name="fee"
            type="number"
            min="0"
            step="0.01"
            placeholder="Walk-in fee"
            [(ngModel)]="fee"
          />
        </label>

        <div class="pair">
          <label>
            {{ isEdit ? 'Add payment received (₹)' : 'Payment received now (₹)' }}
            <input
              name="received"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              [(ngModel)]="receivedAmount"
            />
          </label>
          <label>
            Mode
            <select name="mode" [(ngModel)]="mode">
              <option *ngFor="let m of modes" [value]="m">{{ m }}</option>
            </select>
          </label>
        </div>

        <label>
          Session notes
          <textarea name="notes" rows="3" [(ngModel)]="notes"></textarea>
        </label>
      </div>

      <div *ngIf="err" role="alert" class="formerr">{{ err }}</div>

      <div class="buttons formend">
        <button class="primary" type="submit">Save appointment</button>
        <button
          *ngIf="isEdit"
          type="button"
          class="secondary"
          (click)="deleteVisit.emit(visitData)"
        >
          <app-icon name="Trash2" [size]="15"></app-icon>
          Delete
        </button>
      </div>
    </form>
  `
})
export class VisitFormComponent implements OnInit {
  @Input() clinic: Clinic | null = null;
  @Input() visitData?: Visit;
  @Input() fixedPatientId?: string;
  @Output() commit = new EventEmitter<{ visit: Visit; payment?: { amount: number; mode: string } }>();
  @Output() deleteVisit = new EventEmitter<Visit>();

  patientId = '';
  pp = '';
  visitDate = day();
  visitTime = '09:00';
  sessionStatus = 'Scheduled';
  fee = '';
  receivedAmount = '';
  mode = 'Cash';
  notes = '';
  err = '';
  modes = MODES;

  get isEdit(): boolean {
    return !!this.visitData;
  }

  ngOnInit() {
    if (this.visitData) {
      this.patientId = this.visitData.patient;
      this.pp = this.visitData.pp || '';
      this.visitDate = this.visitData.date;
      this.visitTime = this.visitData.time;
      this.sessionStatus = this.visitData.status;
      this.fee = this.visitData.fee ? String(this.visitData.fee) : '';
      this.notes = this.visitData.notes || '';
    } else {
      this.patientId = this.fixedPatientId || '';
      if (this.patientId) {
        this.pp = this.getFirstAvailablePack(this.patientId);
      }
    }
  }

  getFirstAvailablePack(patientId: string): string {
    if (!this.clinic) return '';
    const packs = this.clinic.assigned
      .filter(a => a.patient === patientId && a.sessions - used(this.clinic!, a.id) > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    return packs[0]?.id || '';
  }

  onPatientChange(newPid: string) {
    this.patientId = newPid;
    this.pp = this.getFirstAvailablePack(newPid);
    this.err = '';
  }

  get availablePacks(): Assigned[] {
    if (!this.clinic || !this.patientId) return [];
    return this.clinic.assigned.filter(
      a =>
        a.patient === this.patientId &&
        (a.id === this.visitData?.pp || a.sessions - used(this.clinic!, a.id) > 0)
    );
  }

  get hasAssignedPacks(): boolean {
    return !!this.clinic?.assigned.some(a => a.patient === this.patientId);
  }

  get selectedPack(): Assigned | undefined {
    return this.clinic?.assigned.find(a => a.id === this.pp);
  }

  getRemainingSessions(a: Assigned): number {
    return this.clinic ? Math.max(0, a.sessions - used(this.clinic, a.id)) : 0;
  }

  formatSessionInfo(): string {
    if (!this.selectedPack || !this.clinic) return '';
    const rem = this.getRemainingSessions(this.selectedPack);
    const consumes =
      (this.sessionStatus === 'Completed' && this.visitData?.status !== 'Completed') ||
      (this.sessionStatus === 'Completed' && this.visitData?.pp !== this.pp);

    if (this.sessionStatus === 'Completed') {
      return consumes
        ? `This session uses 1 of ${rem} remaining → ${Math.max(0, rem - 1)} left after saving`
        : `Session counted · ${rem} left on this package`;
    }
    return `${rem} session${rem === 1 ? '' : 's'} left · 1 is deducted when marked Completed`;
  }

  submit() {
    if (!this.patientId) return;

    if (this.sessionStatus === 'Completed' && this.pp && this.clinic) {
      const a = this.clinic.assigned.find(x => x.id === this.pp);
      const others = this.clinic.visits.filter(
        x => x.pp === this.pp && x.status === 'Completed' && x.id !== this.visitData?.id
      ).length;
      if (!a || a.sessions - others <= 0) {
        this.err = 'No sessions left on this package. Assign a new package or choose Walk-in.';
        return;
      }
    }

    const amt = Number(this.receivedAmount) || 0;
    const payment = amt > 0 ? { amount: amt, mode: this.mode } : undefined;

    const v: Visit = {
      id: this.visitData?.id || crypto.randomUUID(),
      patient: this.patientId,
      date: this.visitDate,
      time: this.visitTime,
      status: this.sessionStatus,
      notes: this.notes,
      pp: this.pp,
      fee: this.pp ? 0 : Math.max(0, Number(this.fee) || 0)
    };

    this.commit.emit({ visit: v, payment });
  }
}

@Component({
  selector: 'app-patient-detail',
  template: `
    <div class="record" *ngIf="clinic && patient">
      <div class="recname">
        <div>
          <small>{{ patient.id }}</small>
          <h2>{{ patient.name }}</h2>
        </div>
        <app-badge [status]="patient.status"></app-badge>
      </div>

      <p>{{ patient.age }} years · {{ patient.gender }} · Registered {{ formatDate(patient.date) }}</p>

      <h3>Condition</h3>
      <p>{{ patient.condition }}</p>

      <h3>Contact</h3>
      <p>{{ patient.phone || 'No phone number recorded.' }}</p>

      <h3>Clinical notes</h3>
      <p class="notes">{{ patient.notes || 'No clinical notes recorded.' }}</p>

      <app-patient-billing
        [clinic]="clinic"
        [patient]="patient"
        (assignPackage)="assignPackage.emit()"
        (editPayment)="editPayment.emit($event)"
        (removePackage)="removePackage.emit($event)"
      ></app-patient-billing>

      <h3 class="gap">Appointment history</h3>
      <button
        class="history"
        *ngFor="let v of patientVisits"
        (click)="editVisit.emit(v)"
      >
        {{ formatDate(v.date) }} · {{ v.time }} · {{ v.status }}{{ getVisitPackageName(v) }}
        <app-icon name="ChevronRight" [size]="14"></app-icon>
      </button>

      <p *ngIf="patientVisits.length === 0">No appointments recorded.</p>

      <div class="buttons">
        <button class="primary" (click)="bookSession.emit()">Book session</button>
        <button class="secondary" (click)="editPatient.emit()">Edit patient</button>
        <button class="secondary" (click)="downloadReport.emit()">
          <app-icon name="Download" [size]="15"></app-icon>
          Patient report
        </button>
      </div>
    </div>
  `
})
export class PatientDetailComponent {
  @Input() clinic: Clinic | null = null;
  @Input() patient: Patient | null = null;
  @Output() assignPackage = new EventEmitter<void>();
  @Output() editPayment = new EventEmitter<any>();
  @Output() removePackage = new EventEmitter<Assigned>();
  @Output() editVisit = new EventEmitter<Visit>();
  @Output() bookSession = new EventEmitter<void>();
  @Output() editPatient = new EventEmitter<void>();
  @Output() downloadReport = new EventEmitter<void>();

  formatDate(d: string): string {
    return pretty(d);
  }

  get patientVisits(): Visit[] {
    if (!this.clinic || !this.patient) return [];
    return this.clinic.visits
      .filter(v => v.patient === this.patient!.id)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }

  getVisitPackageName(v: Visit): string {
    if (!this.clinic) return '';
    const pkg = this.clinic.assigned.find(a => a.id === v.pp);
    return pkg ? ` · ${pkg.name}` : ' · Walk-in';
  }
}

