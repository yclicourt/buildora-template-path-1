import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TokenPairResponse {
  access: string;
  /** Returned by the backend for non-browser clients. The SPA IGNORES it:
   * the refresh token lives only in the httpOnly cookie. */
  refresh: string;
}

interface AccessResponse {
  access: string;
}

interface DetailResponse {
  detail: string;
}

/**
 * Authentication state.
 *
 * The access token lives ONLY in memory (this private field). It is never
 * written to localStorage, sessionStorage, or any cookie the frontend can
 * read. The refresh token lives in the backend's httpOnly cookie
 * (`refresh_token`, path `/api/auth/`, SameSite=Lax, 7 days); the browser
 * sends it automatically on auth requests made with credentials.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Current user, or null when not logged in. */
  readonly user = signal<User | null>(null);

  /** Derived: true once the user profile has been loaded. */
  readonly isAuthenticated = computed(() => this.user() !== null);

  /** Access token, memory only. Never persisted. */
  private accessToken: string | null = null;

  /** In-flight refresh request, shared by every concurrent caller. */
  private refreshInFlight: Observable<string> | null = null;

  /** Raw access token for the HTTP interceptor. */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Create an account. Returns the user; the backend returns no tokens
   * here, so the user logs in afterwards. */
  register(name: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/api/auth/register`, {
      name,
      email,
      password,
    });
  }

  /** Log in. Stores the access token in memory (the JSON `refresh` field
   * is ignored on purpose) and loads the profile. */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<TokenPairResponse>(`${this.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.accessToken = res.access;
        }),
        switchMap(() => this.loadMe()),
        tap((user) => this.user.set(user)),
      );
  }

  /** Current profile (requires a valid access token). */
  loadMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/auth/me`);
  }

  /** Example admin-only endpoint (401 anonymous, 403 non-admin, 200 admin). */
  adminOnly(): Observable<DetailResponse> {
    return this.http.get<DetailResponse>(`${this.apiUrl}/api/auth/admin-only`);
  }

  /**
   * Refresh the access token from the httpOnly cookie (no body: the
   * backend reads the cookie). Single-flight: concurrent callers share
   * the one in-flight request.
   */
  refreshAccessToken(): Observable<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<AccessResponse>(`${this.apiUrl}/api/auth/refresh`, {})
        .pipe(
          map((res) => res.access),
          tap((access) => {
            this.accessToken = access;
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
          finalize(() => {
            this.refreshInFlight = null;
          }),
        );
    }
    return this.refreshInFlight;
  }

  /**
   * Restore a session after a page reload: refresh the access token from
   * the cookie, then load the profile. Emits true on success, false when
   * there is no usable session (no cookie, expired, or blacklisted).
   */
  restoreSession(): Observable<boolean> {
    if (this.user() !== null) {
      return of(true);
    }
    return this.refreshAccessToken().pipe(
      switchMap(() => this.loadMe()),
      tap((user) => this.user.set(user)),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** Log out: blacklist the refresh token server-side and clear the
   * in-memory session. The local session is cleared even if the server
   * call fails, so logout always completes. */
  logout(): Observable<void> {
    return this.http.post<DetailResponse>(`${this.apiUrl}/api/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((err) => {
        this.clearSession();
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }

  /** Drop the in-memory session (access token + user). */
  clearSession(): void {
    this.accessToken = null;
    this.user.set(null);
  }
}
