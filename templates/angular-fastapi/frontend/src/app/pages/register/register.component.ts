import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/api-error';

/** Backend rule (mirrors path 2): the password must not be only digits. */
function notAllDigits(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (typeof value === 'string' && value.length > 0 && /^\d+$/.test(value)) {
    return { allDigits: true };
  }
  return null;
}

const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
const STRENGTH_COLORS = ['#dc2626', '#dc2626', '#d97706', '#ea580c', '#16a34a'];

/** Simple strength score 0–4: length ≥ 8, mixed case, digit, symbol. */
function passwordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly strength = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), notAllDigits]],
  });

  constructor() {
    this.form.controls.password.valueChanges.subscribe((value) => {
      this.strength.set(passwordScore(value ?? ''));
    });
  }

  strengthLabel(): string {
    return STRENGTH_LABELS[this.strength()];
  }

  strengthColor(): string {
    return STRENGTH_COLORS[this.strength()];
  }

  /** Whether meter segment `index` (0-based) is filled. */
  segmentFilled(index: number): boolean {
    return index < this.strength();
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register(name, email, password).subscribe({
      next: () => {
        void this.router.navigate(['/login'], { queryParams: { registered: '1' } });
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
