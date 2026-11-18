import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Clinic, Pkg, money } from '../../models/clinic.model';

@Component({
  selector: 'app-packages-page',
  template: `
    <section class="panel patientpanel" *ngIf="clinic">
      <div class="panelhead">
        <h2>Package master</h2>
        <small>{{ clinic.packages.length }} package{{ clinic.packages.length === 1 ? '' : 's' }}</small>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Package name</th>
              <th>Sessions</th>
              <th>Cost per session</th>
              <th>Package total</th>
              <th>Sold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let k of clinic.packages" (click)="pickPackage.emit(k)">
              <td><b>{{ k.name }}</b></td>
              <td>{{ k.sessions }}</td>
              <td>{{ formatMoney(k.rate) }}</td>
              <td>{{ formatMoney(k.sessions * k.rate) }}</td>
              <td>{{ getSoldCount(k.id) }}</td>
              <td>
                <span [class]="'badge ' + (k.active ? 'green' : 'blue')">
                  <i></i>{{ k.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="clinic.packages.length === 0" class="empty">
        <app-icon name="Package" [size]="28"></app-icon>
        <p>No packages yet. Add one to start selling session packs.</p>
      </div>
    </section>
  `
})
export class PackagesPageComponent {
  @Input() clinic: Clinic | null = null;
  @Output() pickPackage = new EventEmitter<Pkg>();

  formatMoney(n: number): string {
    return money(n);
  }

  getSoldCount(pkgId: string): number {
    return this.clinic ? this.clinic.assigned.filter(a => a.pkg === pkgId).length : 0;
  }
}

@Component({
  selector: 'app-package-form',
  template: `
    <form (ngSubmit)="submit()">
      <div class="fields">
        <label>
          Package name
          <input
            name="name"
            [(ngModel)]="name"
            autoFocus
            required
            maxlength="80"
            placeholder="e.g. 10-Session Pack"
          />
        </label>

        <div class="pair">
          <label>
            No. of sessions
            <input
              name="sessions"
              type="number"
              min="1"
              step="1"
              required
              [(ngModel)]="sessions"
            />
          </label>
          <label>
            Cost per session (₹)
            <input
              name="rate"
              type="number"
              min="0"
              step="0.01"
              required
              [(ngModel)]="rate"
            />
          </label>
        </div>

        <div class="calc">
          Package total <b>{{ formattedTotal }}</b>
        </div>

        <label>
          Status
          <select name="status" [(ngModel)]="status">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

        <small *ngIf="packageData">
          Changes apply to new sales only. Packages already assigned to patients keep their original sessions and price.
        </small>
      </div>

      <div class="buttons formend">
        <button class="primary" type="submit">Save package</button>
        <button
          *ngIf="packageData"
          type="button"
          class="secondary"
          (click)="deletePackage.emit(packageData)"
        >
          <app-icon name="Trash2" [size]="15"></app-icon>
          Delete
        </button>
      </div>
    </form>
  `
})
export class PackageFormComponent implements OnInit {
  @Input() packageData?: Pkg;
  @Output() commit = new EventEmitter<Pkg>();
  @Output() deletePackage = new EventEmitter<Pkg>();

  name = '';
  sessions = '10';
  rate = '';
  status = 'Active';

  ngOnInit() {
    if (this.packageData) {
      this.name = this.packageData.name;
      this.sessions = String(this.packageData.sessions);
      this.rate = String(this.packageData.rate);
      this.status = this.packageData.active ? 'Active' : 'Inactive';
    }
  }

  get formattedTotal(): string {
    const s = Number(this.sessions) || 0;
    const r = Number(this.rate) || 0;
    return money(s * r);
  }

  submit() {
    const trimmedName = this.name.trim();
    const s = Math.floor(Number(this.sessions));
    const r = Number(this.rate);

    if (!trimmedName || !(s >= 1) || !(r >= 0)) return;

    const pkgToSave: Pkg = {
      id: this.packageData?.id || crypto.randomUUID(),
      name: trimmedName,
      sessions: s,
      rate: r,
      active: this.status === 'Active'
    };

    this.commit.emit(pkgToSave);
  }
}
