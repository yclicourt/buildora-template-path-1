"use client";
import { useState } from "react";
import SideNav from "./SideNav";
import Image from "next/image";

function SideNaVWrapper() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E7E0D4] bg-white px-5 py-3 lg:hidden">
        <span className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em] text-[#1C1917]">
          <Image
            width={30}
            height={30}
            alt="Logo {{PROJECT_TITLE}}"
            src="/logo.svg"
          />
          {{PROJECT_TITLE}}
        </span>
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={navOpen}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E7E0D4] bg-white text-[#1C1917]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>
      <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}

export default SideNaVWrapper;
