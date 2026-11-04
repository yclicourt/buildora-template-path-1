import type { ReactNode } from "react";

/**
 * Shared shell for the full-viewport auth pages (login, register):
 * centered card on a neutral background, premium rectangular buttons
 * (44px height, 10px radius, no pills) via the classes in the pages.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 text-stone-900">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-xl font-bold tracking-tight">
          {{PROJECT_TITLE}}
        </p>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-stone-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Shared classes for the auth forms (kept identical across pages). */
export const inputClass =
  "h-11 w-full rounded-[10px] border border-stone-300 bg-white px-4 text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-900";

export const buttonClass =
  "h-11 w-full rounded-[10px] bg-stone-900 px-5 text-[15px] font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50";

export const labelClass =
  "mb-1.5 block text-sm font-medium text-stone-700";

export const errorClass =
  "rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800";

export const noticeClass =
  "rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800";
