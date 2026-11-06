import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Protects /dashboard. If the user is already loaded, let them in. If
 * not (fresh page load, access token only in memory), try to restore the
 * session from the refresh cookie; on failure send them to /login with
 * the intended URL to come back to.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return auth.restoreSession().pipe(
    map((restored) =>
      restored
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};
