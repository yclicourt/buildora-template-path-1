import { useEffect, useState } from "react";
import { ApiError, getHealth } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toSpanishMessage } from "../lib/errors";
import { navigate } from "../lib/router";

type AdminState = "checking" | "granted" | "denied" | "error";
type ApiStatus = "checking" | "ok" | "unavailable";

export default function DashboardPage() {
  const { status, user, logout, authFetch } = useAuth();
  const [adminState, setAdminState] = useState<AdminState>("checking");
  const [adminError, setAdminError] = useState("");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [loggingOut, setLoggingOut] = useState(false);

  // The admin section only exists for admins: non-admin users never
  // see it and never trigger the call.
  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }
    let cancelled = false;
    authFetch<{ detail: string }>("/api/auth/admin-only/")
      .then(() => {
        if (!cancelled) setAdminState("granted");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setAdminState("denied");
        } else {
          setAdminState("error");
          setAdminError(toSpanishMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role, authFetch]);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then(() => {
        if (!cancelled) setApiStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setApiStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-600">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-6 py-3 sm:h-16 sm:py-0">
          <span className="text-base font-bold tracking-tight sm:text-lg">
            {{PROJECT_TITLE}}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs sm:text-sm ${
                apiStatus === "ok"
                  ? "bg-emerald-100 text-emerald-800"
                  : apiStatus === "checking"
                    ? "bg-stone-200 text-stone-600"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {apiStatus === "ok"
                ? "API disponible"
                : apiStatus === "checking"
                  ? "Comprobando API…"
                  : "API no disponible"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-10 rounded-[10px] border border-stone-300 bg-white px-4 text-sm font-semibold hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5 sm:text-[15px]"
            >
              {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Esta es tu sesión: los datos siguientes vienen de{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-sm">
            /api/auth/me/
          </code>
          .
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Nombre</h2>
            <p className="mt-1 text-sm text-stone-500">{user.name}</p>
          </section>
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Correo</h2>
            <p className="mt-1 text-sm text-stone-500">{user.email}</p>
          </section>
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Rol</h2>
            <p className="mt-1 text-sm text-stone-500">{user.role}</p>
          </section>
        </div>
        {user.role === "admin" && (
          <section className="mt-4 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Sección de administrador</h2>
            {adminState === "checking" && (
              <p className="mt-1 text-sm text-stone-500">
                Comprobando acceso de administrador…
              </p>
            )}
            {adminState === "granted" && (
              <p className="mt-1 text-sm text-stone-500">
                Acceso de administrador concedido.
              </p>
            )}
            {adminState === "denied" && (
              <p className="mt-1 text-sm text-red-800">
                Tu rol ya no permite ver esta sección.
              </p>
            )}
            {adminState === "error" && (
              <p className="mt-1 text-sm text-red-800">{adminError}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
