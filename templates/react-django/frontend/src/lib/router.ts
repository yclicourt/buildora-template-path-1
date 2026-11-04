/**
 * Minimal history-based router — no router library.
 *
 * The three routes (/login, /register, /dashboard) are real URLs:
 * `navigate` pushes a history entry and notifies subscribers, and
 * `useRoute` follows both programmatic navigation and the browser
 * back/forward buttons. Unknown paths fall back to the login screen
 * (the App component redirects them there). This keeps the dependency
 * list at React only; a router library can replace this file later
 * without touching the pages, which only call `navigate`.
 */

import { useEffect, useState } from "react";

export type Route = "/login" | "/register" | "/dashboard";

const KNOWN_ROUTES: Route[] = ["/login", "/register", "/dashboard"];

const ROUTE_EVENT = "app:navigate";

export function getRoute(): Route {
  const path = window.location.pathname;
  if ((KNOWN_ROUTES as string[]).includes(path)) {
    return path as Route;
  }
  return "/login";
}

export function navigate(path: Route, state?: unknown): void {
  if (window.location.pathname !== path) {
    window.history.pushState(state ?? null, "", path);
  } else if (state !== undefined) {
    window.history.replaceState(state, "", path);
  }
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(getRoute);
  useEffect(() => {
    const update = () => setRoute(getRoute());
    window.addEventListener("popstate", update);
    window.addEventListener(ROUTE_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(ROUTE_EVENT, update);
    };
  }, []);
  return route;
}

/** State attached by `navigate(path, state)` (e.g. "just registered"). */
export function getNavigationState<T>(): T | null {
  return (window.history.state as T | null) ?? null;
}
