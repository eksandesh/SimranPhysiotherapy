import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicService } from '../../services/clinic.service';
import { DialogService } from '../../services/dialog.service';
import { Clinic, Pkg, money } from '../../models/clinic.model';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit, OnDestroy {
  clinic: Clinic | null = null;
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

  formatMoney(n: number): string {
    return money(n);
  }

  getSoldCount(pkgId: string): number {
    return this.clinic ? this.clinic.assigned.filter(a => a.pkg === pkgId).length : 0;
  }

  pickPackage(pkg: Pkg): void {
    this.dialogService.editPackage(pkg);
  }
}
