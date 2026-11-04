import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { toSpanishMessage } from "../lib/errors";
import { getNavigationState, navigate } from "../lib/router";
import AuthLayout, {
  buttonClass,
  errorClass,
  inputClass,
  labelClass,
  noticeClass,
} from "../components/AuthLayout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const justRegistered =
    getNavigationState<{ registered?: boolean }>()?.registered === true;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const emailValue = email.trim();
    if (!EMAIL_RE.test(emailValue)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (!password) {
      setError("Escribe tu contraseña.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await login(emailValue, password);
      navigate("/dashboard");
    } catch (err) {
      setError(toSpanishMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Entra a tu panel con tu correo y contraseña."
    >
      {justRegistered && (
        <p className={`${noticeClass} mb-4`}>
          Cuenta creada. Inicia sesión con tu correo y contraseña.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Correo
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            maxLength={254}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="login-password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        {error && (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        )}
        <button type="submit" disabled={sending} className={buttonClass}>
          {sending ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-600">
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="font-semibold text-stone-900 underline underline-offset-2"
        >
          Regístrate
        </button>
      </p>
    </AuthLayout>
  );
}
