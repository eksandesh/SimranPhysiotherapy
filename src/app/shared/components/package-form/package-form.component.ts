import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Pkg, money } from '../../../models/clinic.model';

@Component({
  selector: 'app-package-form',
  templateUrl: './package-form.component.html',
  styleUrls: ['./package-form.component.css']
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

