import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export const AUTH_KEY = 'simran-auth';
const CREDENTIAL_HASH = '42abce0550080dc4eaf8afed46cf8f59afe408f7e31c8aa944ff1ab39f6d3dd1';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authedSubject = new BehaviorSubject<boolean>(this.checkAuthStatus());
  public authed$: Observable<boolean> = this.authedSubject.asObservable();

  private fails = 0;
  private lockoutUntil = 0;

  constructor() {}

  private checkAuthStatus(): boolean {
    try {
      return sessionStorage.getItem(AUTH_KEY) === '1';
    } catch {
      return false;
    }
  }

  public isAuthenticated(): boolean {
    return this.authedSubject.value;
  }

  public getLockoutRemaining(): number {
    const remainingMs = this.lockoutUntil - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  public async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    const now = Date.now();
    if (now < this.lockoutUntil) {
      return {
        success: false,
        error: `Too many attempts. Try again in ${Math.ceil((this.lockoutUntil - now) / 1000)} seconds.`
      };
    }

    if (!globalThis.crypto?.subtle) {
      return {
        success: false,
        error: 'Sign-in needs a secure (https) connection. Open the clinic site over https.'
      };
    }

    const hash = await sha256(`${username.trim()}:${password}`);
    const ok = hash === CREDENTIAL_HASH;

    if (ok) {
      try {
        sessionStorage.setItem(AUTH_KEY, '1');
      } catch {}
      this.fails = 0;
      this.lockoutUntil = 0;
      this.authedSubject.next(true);
      return { success: true };
    }

    this.fails++;
    if (this.fails % 5 === 0) {
      this.lockoutUntil = Date.now() + 30000;
      return {
        success: false,
        error: 'Too many attempts. Please wait 30 seconds.'
      };
    }

    return {
      success: false,
      error: 'Incorrect username or password.'
    };
  }

  public logout(): void {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {}
    this.authedSubject.next(false);
  }
}

