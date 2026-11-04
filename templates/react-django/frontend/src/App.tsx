import { useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { navigate, useRoute, type Route } from "./lib/router";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-600">
      Cargando…
    </div>
  );
}

/**
 * Route guard, in one place:
 * - "/" goes to /dashboard when authenticated, /login otherwise.
 * - Unknown paths go to /login.
 * - /dashboard requires a session (me() succeeded, refreshing once on
 *   401 like the path-1 client); otherwise it goes to /login.
 * - An authenticated user opening /login or /register goes to
 *   /dashboard instead of seeing the forms again.
 */
function Router() {
  const route = useRoute();
  const { status } = useAuth();
  const pathname = window.location.pathname;

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    let target: Route | null = null;
    if (pathname === "/") {
      target = status === "authenticated" ? "/dashboard" : "/login";
    } else if (
      pathname !== "/login" &&
      pathname !== "/register" &&
      pathname !== "/dashboard"
    ) {
      target = "/login";
    } else if (route === "/dashboard" && status === "anonymous") {
      target = "/login";
    } else if (
      (route === "/login" || route === "/register") &&
      status === "authenticated"
    ) {
      target = "/dashboard";
    }
    if (target && window.location.pathname !== target) {
      navigate(target);
    }
  }, [pathname, route, status]);

  if (pathname === "/") {
    return <LoadingScreen />;
  }
  if (status === "loading" && route === "/dashboard") {
    return <LoadingScreen />;
  }
  if (route === "/dashboard" && status === "anonymous") {
    return <LoadingScreen />;
  }
  if (
    (route === "/login" || route === "/register") &&
    status === "authenticated"
  ) {
    return <LoadingScreen />;
  }

  switch (route) {
    case "/register":
      return <RegisterPage />;
    case "/dashboard":
      return <DashboardPage />;
    case "/login":
    default:
      return <LoginPage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
