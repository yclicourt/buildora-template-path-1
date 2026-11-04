"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/auth-client";

function LoginFormWrapper() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(email: string, password: string) {
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (e) {
      // El spec pide mensaje claro, no el código crudo.
      if (e instanceof ApiError && e.code === "INVALID_CREDENTIALS") {
        setError("Correo o contraseña incorrectos.");
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    handleLogin(
      String(data.get("email") ?? ""),
      String(data.get("password") ?? ""),
    );
  }
  return (
    <div className="flex min-h-dvh w-full flex-col justify-center bg-[#FAF7F2] bg-[radial-gradient(#E7E0D4_1px,transparent_1px)] bg-[size:22px_22px] px-6 pb-10 pt-7 text-[#1C1917] lg:w-1/2 lg:px-11">
      {/* Barra superior: logo a la izquierda, cambio a registro a la derecha */}
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
        <Link href="/register" className="text-[13.5px] text-[#57534E]">
          ¿No tienes cuenta? <b className="text-[#EA580C]">Crea una</b>
        </Link>
      </div>

      {/* Formulario */}
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="mb-2.5 mt-11 text-[32px] font-bold leading-[1.15] tracking-[-0.02em]">
          Bienvenido de nuevo,{" "}
          <span className="font-serif text-[34px] font-normal italic text-[#EA580C]">
            constructor.
          </span>
        </h1>
        <p className="mb-[30px] text-[15.5px] leading-[1.55] text-[#57534E]">
          Inicia sesión para seguir forjando tus proyectos.
        </p>

        <form onSubmit={handleSubmit}>
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 w-full rounded-[10px] border border-[#E7E0D4] bg-white pl-[42px] pr-[72px] text-[15px] text-[#1C1917] outline-none transition placeholder:text-[#A8A29E] focus:border-[#EA580C] focus:ring-[3px] focus:ring-[#EA580C]/15"
              />
            </div>
            {error && (
              <p className="text-[15px] text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="mb-[22px] flex items-center justify-between text-sm text-[#57534E]">
            <label className="m-0 flex cursor-pointer items-center gap-2 font-normal">
              <input
                type="checkbox"
                defaultChecked
                className="accent-[#EA580C]"
              />{" "}
              Recuérdame
            </label>
            <Link
              href="#"
              className="font-medium text-[#EA580C] opacity-55"
              title="El flujo de recuperación llega en otro sprint"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            id="submit"
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#1C1917] bg-[#1C1917] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgb(28_25_23/0.2)] transition hover:-translate-y-px hover:bg-[#0C0A09] hover:shadow-[0_6px_16px_rgb(28_25_23/0.2)] disabled:transform-none disabled:cursor-default disabled:opacity-60"
          >
            {busy ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-4 text-center text-[12.5px] leading-[1.5] text-[#A8A29E]">
          Al continuar aceptas los Términos y la Política de privacidad.
        </p>
      </div>
    </div>
  );
}

export default LoginFormWrapper;
