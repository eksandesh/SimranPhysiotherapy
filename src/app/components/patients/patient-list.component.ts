import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Clinic, Patient, remainingFor, balance, money } from '../../models/clinic.model';

@Component({
  selector: 'app-patient-list',
  template: `
    <section class="panel patientpanel">
      <div class="panelhead">
        <h2>{{ showMore ? 'Recent patients' : 'Patient register' }}</h2>
        <button *ngIf="showMore" class="link" (click)="more.emit()">
          View all
          <app-icon name="ArrowUpRight" [size]="15"></app-icon>
        </button>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Patient name</th>
              <th>Condition</th>
              <th *ngIf="clinic">Sessions left</th>
              <th *ngIf="clinic">Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of patients; let i = index" (click)="pick.emit(p)">
              <td>
                <button class="patientbtn" (click)="$event.stopPropagation(); pick.emit(p)">
                  <span [class]="'avatar tint' + (i % 5)">
                    {{ getInitials(p.name) }}
                  </span>
                  <span>
                    <b>{{ p.name }}</b>
                    <small>{{ p.id }}</small>
                  </span>
                </button>
              </td>
              <td>{{ p.condition }}</td>
              <td *ngIf="clinic">
                {{ hasAssigned(p.id) ? getRemaining(p.id) : '—' }}
              </td>
              <td *ngIf="clinic">
                <ng-container [ngSwitch]="getBalanceState(p.id)">
                  <b *ngSwitchCase="'owe'" class="owe">{{ formatBalance(p.id) }} due</b>
                  <span *ngSwitchCase="'adv'" class="adv">{{ formatBalance(p.id) }} adv.</span>
                  <span *ngSwitchDefault>—</span>
                </ng-container>
              </td>
              <td>
                <app-badge [status]="p.status"></app-badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="patients.length === 0" class="empty">
        <app-icon name="UsersRound" [size]="28"></app-icon>
        <p>No patients found.</p>
      </div>
    </section>
  `
})
export class PatientListComponent {
  @Input() patients: Patient[] = [];
  @Input() clinic: Clinic | null = null;
  @Input() showMore = false;
  @Output() pick = new EventEmitter<Patient>();
  @Output() more = new EventEmitter<void>();

  getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0])
      .join('');
  }

  hasAssigned(patientId: string): boolean {
    return !!this.clinic?.assigned.some(a => a.patient === patientId);
  }

  getRemaining(patientId: string): number {
    return this.clinic ? remainingFor(this.clinic, patientId) : 0;
  }

  getBalance(patientId: string): number {
    return this.clinic ? balance(this.clinic, patientId) : 0;
  }

  getBalanceState(patientId: string): 'owe' | 'adv' | 'none' {
    const bal = this.getBalance(patientId);
    if (bal > 0.004) return 'owe';
    if (bal < -0.004) return 'adv';
    return 'none';
  }

  formatBalance(patientId: string): string {
    const bal = Math.abs(this.getBalance(patientId));
    return money(bal);
  }
}

