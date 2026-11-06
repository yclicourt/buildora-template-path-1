import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/** Marks a request that already went through one refresh-and-retry. */
const RETRIED = new HttpContextToken<boolean>(() => false);

/** Auth endpoints that must never trigger a refresh-and-retry. */
function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/refresh')
  );
}

/**
 * Attaches the in-memory access token to API requests, sends credentials
 * (so the browser includes the httpOnly refresh cookie), and on a 401
 * refreshes the token once (single-flight, shared by concurrent 401s)
 * and retries the original request a single time.
 *
 * A failed refresh means the session is gone: the in-memory state is
 * cleared and the user is sent to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only API traffic goes through auth handling.
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  let request = req.clone({ withCredentials: true });
  const token = auth.getAccessToken();
  if (token && !isAuthEndpoint(request.url)) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request).pipe(
    catchError((err: unknown) => {
      if (
        !(err instanceof HttpErrorResponse) ||
        err.status !== 401 ||
        request.context.get(RETRIED) ||
        isAuthEndpoint(request.url)
      ) {
        return throwError(() => err);
      }

      const retried = request.clone({
        context: request.context.set(RETRIED, true),
      });

      return auth.refreshAccessToken().pipe(
        switchMap((newToken) =>
          next(
            retried.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            }),
          ),
        ),
        catchError((refreshErr: unknown) => {
          auth.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
