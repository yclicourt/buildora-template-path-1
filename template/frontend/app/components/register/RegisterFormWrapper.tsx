"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, ApiError } from "@/lib/auth-client";
import { useState } from "react";

function RegisterFormWrapper() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRegisterSubmit(
    name: string,
    email: string,
    password: string,
  ) {
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email, name, password);
      router.push("/login");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onRegisterSubmit(
      String(data.get("name") ?? ""),
      String(data.get("email") ?? ""),
      String(data.get("password") ?? ""),
    );
  }

  function passwordScore(pw: string): number {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  const score = passwordScore(password);
  const strengthLabel = ["", "Débil", "Aceptable", "Buena", "Fuerte"][score];

  return (
    <div className="flex min-h-dvh w-full flex-col justify-center bg-[#FAF7F2] bg-[radial-gradient(#E7E0D4_1px,transparent_1px)] bg-[size:22px_22px] px-6 pb-10 pt-7 text-[#1C1917] lg:w-1/2 lg:px-11">
      {/* Barra superior: logo a la izquierda, cambio a login a la derecha */}
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em] text-[#1C1917]"
        >
          <Image
            width={30}
            height={30}
            alt="Logo {{PROJECT_TITLE}}"
            src="/logo.svg"
          />
          {{PROJECT_TITLE}}
        </Link>
        <Link href="/login" className="text-[13.5px] text-[#57534E]">
          ¿Ya tienes cuenta? <b className="text-[#EA580C]">Entra</b>
        </Link>
      </div>

      {/* Formulario */}
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="mb-2.5 mt-11 text-[32px] font-bold leading-[1.15] tracking-[-0.02em]">
          Crea tu cuenta{" "}
          <span className="font-serif text-[34px] font-normal italic text-[#EA580C]">
            gratis.
          </span>
        </h1>
        <p className="mb-[30px] text-[15.5px] leading-[1.55] text-[#57534E]">
          Empieza a forjar hoy. Sin tarjeta, sin sorpresas.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-[18px]">
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Nombre
            </label>
            <div className="relative">
              <svg
                className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#A8A29E]"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
              </svg>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Jane Doe"
                required
                autoComplete="name"
                className="h-11 w-full rounded-[10px] border border-[#E7E0D4] bg-white pl-[42px] pr-3.5 text-[15px] text-[#1C1917] outline-none transition placeholder:text-[#A8A29E] focus:border-[#EA580C] focus:ring-[3px] focus:ring-[#EA580C]/15"
              />
            </div>
          </div>

          <div className="relative mb-[18px]">
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Correo electrónico
            </label>
            <div className="relative">
              <svg
                className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#A8A29E]"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
                className="h-11 w-full rounded-[10px] border border-[#E7E0D4] bg-white pl-[42px] pr-3.5 text-[15px] text-[#1C1917] outline-none transition placeholder:text-[#A8A29E] focus:border-[#EA580C] focus:ring-[3px] focus:ring-[#EA580C]/15"
              />
            </div>
          </div>

          <div className="relative mb-[18px]">
            <label htmlFor="pass" className="mb-2 block text-sm font-medium">
              Contraseña
            </label>
            <div className="relative">
              <svg
                className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#A8A29E]"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <input
                id="pass"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                className="h-11 w-full rounded-[10px] border border-[#E7E0D4] bg-white pl-[42px] pr-[72px] text-[15px] text-[#1C1917] outline-none transition placeholder:text-[#A8A29E] focus:border-[#EA580C] focus:ring-[3px] focus:ring-[#EA580C]/15"
              />
            </div>
            {/* Medidor: las 4 barras arrancan neutras; tu estado las pinta */}
            <div className="mt-2.5 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-[5px] flex-1 rounded-full transition-colors ${
                    i < score ? "bg-[#EA580C]" : "bg-[#E7E0D4]"
                  }`}
                />
              ))}
            </div>
            <p id="meter-label" className="mt-1.5 text-[12.5px] text-[#A8A29E]">
              {password.length === 0
                ? "Mínimo 8 caracteres. El medidor es guía, la regla real es del backend."
                : `Fortaleza: ${strengthLabel}. El medidor es guía, la regla real es del backend.`}
            </p>
          </div>
          {error && (
            <p className="text-[15px] text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            id="submit"
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#1C1917] bg-[#1C1917] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgb(28_25_23/0.2)] transition hover:-translate-y-px hover:bg-[#0C0A09] hover:shadow-[0_6px_16px_rgb(28_25_23/0.2)] disabled:transform-none disabled:cursor-default disabled:opacity-60"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-[12.5px] leading-[1.5] text-[#A8A29E]">
          Al crear tu cuenta aceptas los Términos y la Política de privacidad.
        </p>
      </div>
    </div>
  );
}

export default RegisterFormWrapper;
