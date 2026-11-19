import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient, Visit, Pkg, Payment, Assigned, AskConfirm, Clinic } from '../models/clinic.model';

export type ModalMode =
  | ''
  | 'add'
  | 'edit'
  | 'view'
  | 'book'
  | 'pkg'
  | 'pay'
  | 'assign'
  | 'confirm'
  | 'reset'
  | 'restore';

export interface DialogState {
  mode: ModalMode;
  back: string;
  patient?: Patient;
  visit?: Visit;
  pkg?: Pkg;
  payment?: Payment;
  askConfirm?: AskConfirm;
  restoreCandidate?: Clinic;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private initialState: DialogState = {
    mode: '',
    back: ''
  };

  private stateSubject = new BehaviorSubject<DialogState>(this.initialState);
  public state$: Observable<DialogState> = this.stateSubject.asObservable();

  private noticeSubject = new BehaviorSubject<string>('');
  public notice$: Observable<string> = this.noticeSubject.asObservable();

  private noticeTimer: any;

  constructor() {}

  public get currentState(): DialogState {
    return this.stateSubject.value;
  }

  public open(mode: ModalMode, from = '', extra?: Partial<DialogState>): void {
    this.stateSubject.next({
      mode,
      back: from,
      ...extra
    });
  }

  public viewPatient(p: Patient): void {
    this.open('view', '', { patient: p });
  }

  public editPatient(p: Patient): void {
    this.open('edit', '', { patient: p });
  }

  public bookVisit(v?: Visit, from = '', fixedPatientId?: string, patient?: Patient): void {
    this.open('book', from, { visit: v, patient });
  }

  public editPackage(pkg?: Pkg): void {
    this.open('pkg', '', { pkg });
  }

  public recordPayment(payment?: Payment, from = '', patient?: Patient): void {
    this.open('pay', from, { payment, patient });
  }

  public assignPackage(patient: Patient): void {
    this.open('assign', 'view', { patient });
  }

  public confirm(ask: AskConfirm): void {
    this.open('confirm', '', { askConfirm: ask });
  }

  public restore(candidate: Clinic): void {
    this.open('restore', '', { restoreCandidate: candidate });
  }

  public reset(): void {
    this.open('reset');
  }

  public close(): void {
    this.stateSubject.next(this.initialState);
  }

  public showNotice(message: string): void {
    this.noticeSubject.next(message);
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
    }
    this.noticeTimer = setTimeout(() => {
      this.noticeSubject.next('');
    }, 6500);
  }
}

