import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/api-error';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly adminLoading = signal(false);
  readonly adminResult = signal<string | null>(null);
  readonly adminError = signal<string | null>(null);
  readonly loggingOut = signal(false);

  checkAdmin(): void {
    this.adminLoading.set(true);
    this.adminResult.set(null);
    this.adminError.set(null);
    this.auth.adminOnly().subscribe({
      next: (res) => {
        this.adminLoading.set(false);
        this.adminResult.set(res.detail);
      },
      error: (err: unknown) => {
        this.adminLoading.set(false);
        this.adminError.set(apiErrorMessage(err));
      },
    });
  }

  logout(): void {
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
      error: () => {
        // The session is cleared locally even if the server call failed.
        void this.router.navigate(['/login']);
      },
    });
  }
}
