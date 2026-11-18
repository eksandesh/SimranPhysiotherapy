import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Clinic,
  Patient,
  Visit,
  Pkg,
  Assigned,
  Payment,
  seed,
  migrate,
  valid,
  day,
  pretty,
  money,
  balance,
  nextReceipt,
  left
} from '../models/clinic.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicService {
  private clinicSubject = new BehaviorSubject<Clinic | null>(null);
  public clinic$: Observable<Clinic | null> = this.clinicSubject.asObservable();

  private connection: Promise<IDBDatabase> | null = null;

  constructor() {}

  private getDatabase(): Promise<IDBDatabase> {
    if (this.connection) {
      return this.connection;
    }
    this.connection = new Promise((resolve, reject) => {
      const req = indexedDB.open('simran-physio-clinic', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('records');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.connection;
  }

  public async load(): Promise<Clinic> {
    const db = await this.getDatabase();
    const value = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction('records', 'readonly');
      const store = tx.objectStore('records');
      const req = store.get('clinic');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (value) {
      const m = migrate(value);
      if (value.version !== 2) {
        await this.save(m);
      } else {
        this.clinicSubject.next(m);
      }
      return m;
    }

    const seeded = seed();
    await this.save(seeded);
    return seeded;
  }

  public async save(data: Clinic): Promise<void> {
    const db = await this.getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('records', 'readwrite');
      const store = tx.objectStore('records');
      store.put(data, 'clinic');
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
    this.clinicSubject.next(data);
  }

  public getCurrentData(): Clinic | null {
    return this.clinicSubject.value;
  }

  public addPayment(c: Clinic, x: Omit<Payment, 'id'>): Payment[] {
    return [{ ...x, id: nextReceipt(c) }, ...c.payments];
  }

  public async saveVisit(
    v: Visit,
    paymentInfo?: { amount: number; mode: string }
  ): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data loaded' };

    const payments = paymentInfo
      ? this.addPayment(d, {
          patient: v.patient,
          date: day(),
          amount: paymentInfo.amount,
          mode: paymentInfo.mode,
          note: '',
          pp: v.pp,
          visit: v.pp ? '' : v.id
        })
      : d.payments;

    let text = 'Appointment saved.';
    if (v.status === 'Completed' && v.pp) {
      const pkgAssigned = d.assigned.find(a => a.id === v.pp);
      const remainingCount = Math.max(
        0,
        (pkgAssigned?.sessions || 0) -
          d.visits.filter(x => x.pp === v.pp && x.status === 'Completed' && x.id !== v.id).length -
          1
      );
      text = `Session completed. ${remainingCount} session(s) left on the package.`;
    }

    const updated: Clinic = {
      ...d,
      visits: [v, ...d.visits.filter(x => x.id !== v.id)],
      payments
    };

    await this.save(updated);
    return { success: true, message: text };
  }

  public async completeVisit(v: Visit): Promise<{ success: boolean; message: string; requiresEdit?: boolean }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data loaded' };

    if (v.pp) {
      const a = d.assigned.find(x => x.id === v.pp);
      if (!a || left(d, a) <= 0) {
        return {
          success: false,
          message: 'No sessions left on this package. Edit the appointment to change it.'
        };
      }
    } else if (!v.fee) {
      return { success: false, message: '', requiresEdit: true };
    }

    const a = d.assigned.find(x => x.id === v.pp);
    const updated: Clinic = {
      ...d,
      visits: d.visits.map(x => (x.id === v.id ? { ...x, status: 'Completed' } : x))
    };

    const message = a
      ? `Session completed. ${left(d, a) - 1} session(s) left on ${a.name}.`
      : 'Session completed.';

    await this.save(updated);
    return { success: true, message };
  }

  public async savePayment(p: Payment): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    const updatedPayments = p.id
      ? [p, ...d.payments.filter(x => x.id !== p.id)]
      : this.addPayment(d, p);

    await this.save({ ...d, payments: updatedPayments });
    return { success: true, message: 'Payment saved.' };
  }

  public async removePayment(p: Payment): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    await this.save({
      ...d,
      payments: d.payments.filter(x => x.id !== p.id)
    });
    return { success: true, message: 'Payment deleted.' };
  }

  public async removeVisit(v: Visit): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    await this.save({
      ...d,
      visits: d.visits.filter(x => x.id !== v.id),
      payments: d.payments.map(x => (x.visit === v.id ? { ...x, visit: '' } : x))
    });
    return { success: true, message: 'Appointment deleted.' };
  }

  public async removeAssignedPackage(a: Assigned): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    await this.save({
      ...d,
      assigned: d.assigned.filter(x => x.id !== a.id),
      visits: d.visits.map(x => (x.pp === a.id ? { ...x, pp: '' } : x)),
      payments: d.payments.map(x => (x.pp === a.id ? { ...x, pp: '' } : x))
    });
    return { success: true, message: 'Package removed.' };
  }

  public async savePatient(p: Patient): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    let patientId = p.id;
    if (!patientId) {
      patientId = `SP-${Math.max(1000, ...d.patients.map(x => Number(x.id.slice(3)) || 0)) + 1}`;
    }

    const patientWithId: Patient = { ...p, id: patientId };
    await this.save({
      ...d,
      patients: [patientWithId, ...d.patients.filter(x => x.id !== patientWithId.id)]
    });
    return { success: true, message: 'Patient record saved on this device.' };
  }

  public async savePackage(pkg: Pkg): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    await this.save({
      ...d,
      packages: [pkg, ...d.packages.filter(x => x.id !== pkg.id)]
    });
    return { success: true, message: 'Package saved.' };
  }

  public async deletePackage(pkg: Pkg): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    await this.save({
      ...d,
      packages: d.packages.filter(x => x.id !== pkg.id)
    });
    return { success: true, message: 'Package deleted.' };
  }

  public async assignPackage(
    a: Assigned,
    paymentInfo?: { amount: number; mode: string }
  ): Promise<{ success: boolean; message: string }> {
    const d = this.getCurrentData();
    if (!d) return { success: false, message: 'No clinic data' };

    const payments = paymentInfo
      ? this.addPayment(d, {
          patient: a.patient,
          date: day(),
          amount: paymentInfo.amount,
          mode: paymentInfo.mode,
          note: '',
          pp: a.id,
          visit: ''
        })
      : d.payments;

    await this.save({
      ...d,
      assigned: [a, ...d.assigned],
      payments
    });
    return { success: true, message: 'Package assigned.' };
  }

  public async clearWorkspace(): Promise<void> {
    await this.save({
      version: 2,
      demo: false,
      patients: [],
      visits: [],
      packages: [],
      assigned: [],
      payments: []
    });
  }

  public printReceipt(p: Payment): boolean {
    const d = this.getCurrentData();
    if (!d) return false;

    const esc = (s: string) =>
      s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

    const pt = d.patients.find(x => x.id === p.patient);
    const a = d.assigned.find(x => x.id === p.pp);
    const bal = balance(d, p.patient);
    const towards = a ? `${a.name} (${a.sessions} sessions)` : p.visit ? 'Session fee' : 'Treatment';

    const w = window.open('', '_blank', 'width=720,height=820');
    if (!w) return false;

    w.document.write(`<!doctype html><title>Receipt ${esc(p.id)}</title><style>body{font:15px/1.5 Arial,sans-serif;color:#1c302f;max-width:560px;margin:30px auto;padding:0 20px}h1{font-size:24px;margin:0}h2{font-size:15px;font-weight:600;color:#677672;margin:2px 0 22px}table{width:100%;border-collapse:collapse}td{padding:9px 0;border-bottom:1px solid #dee6e3}td:last-child{text-align:right}.big td{font-size:19px;font-weight:700;border-bottom:2px solid #1c302f}.foot{margin-top:26px;font-size:12px;color:#677672}</style>
<h1>Simran Physiotherapy</h1><h2>Payment receipt</h2>
<table><tr><td>Receipt no.</td><td>${esc(p.id)}</td></tr><tr><td>Date</td><td>${esc(pretty(p.date))}</td></tr><tr><td>Received from</td><td>${esc(pt?.name || '')} (${esc(p.patient)})</td></tr><tr><td>Towards</td><td>${esc(towards)}</td></tr><tr><td>Payment mode</td><td>${esc(p.mode)}</td></tr>${p.note ? `<tr><td>Note</td><td>${esc(p.note)}</td></tr>` : ''}<tr class="big"><td>Amount received</td><td>${esc(money(p.amount))}</td></tr><tr><td>${bal > 0.004 ? 'Balance due' : bal < -0.004 ? 'Advance with clinic' : 'Balance'}</td><td>${esc(money(Math.abs(bal)))}</td></tr></table>
<p class="foot">Thank you. This is a computer-generated receipt.</p>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
    return true;
  }
}

