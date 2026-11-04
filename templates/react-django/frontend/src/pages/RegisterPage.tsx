import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { toSpanishMessage } from "../lib/errors";
import { navigate } from "../lib/router";
import AuthLayout, {
  buttonClass,
  errorClass,
  inputClass,
  labelClass,
} from "../components/AuthLayout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nameValue = name.trim();
    const emailValue = email.trim();
    if (!nameValue) {
      setError("Escribe tu nombre.");
      return;
    }
    if (!EMAIL_RE.test(emailValue)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (!password) {
      setError("Escribe una contraseña.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await register(nameValue, emailValue, password);
      // No auto-login: the backend returns no tokens on register, so
      // the user signs in afterwards.
      navigate("/login", { registered: true });
    } catch (err) {
      setError(toSpanishMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate para entrar a tu panel."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="register-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            required
            maxLength={150}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="register-email" className={labelClass}>
            Correo
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Una contraseña segura"
            autoComplete="new-password"
            required
            className={inputClass}
          />
          <p className="mt-1.5 text-sm text-stone-500">
            Mínimo 8 caracteres. Evita contraseñas comunes o solo números.
          </p>
        </div>
        {error && (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        )}
        <button type="submit" disabled={sending} className={buttonClass}>
          {sending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-600">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-semibold text-stone-900 underline underline-offset-2"
        >
          Inicia sesión
        </button>
      </p>
    </AuthLayout>
  );
}
