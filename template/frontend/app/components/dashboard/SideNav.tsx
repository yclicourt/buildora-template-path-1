import Image from "next/image";
import Link from "next/link";
import SideNavUserData from "./SideNavUserData";

type SideNavProps = {
  open?: boolean;
  onClose?: () => void;
};

function SideNav({ open = false, onClose = () => {} }: SideNavProps) {
  return (
    <>
      {/* Fondo oscuro en móvil cuando el menú está abierto */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`${
          open
            ? "fixed inset-y-0 left-0 z-50 flex shadow-xl lg:shadow-none"
            : "hidden"
        } w-[248px] shrink-0 flex-col overflow-y-auto border-r border-[#E7E0D4] bg-white px-4 py-[22px] lg:static lg:flex`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onClose}
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
          {/* Cerrar (solo móvil) */}
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[#57534E] hover:bg-[#F5F1EA] lg:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Buscador estilo ⌘K: solo diseño, la funcionalidad llega en otro sprint */}
        <div className="mb-6 flex items-center justify-between rounded-[10px] border border-[#E7E0D4] px-3 py-[9px] text-[13.5px] text-[#A8A29E]">
          <span>⌕ Buscar…</span>
          <kbd className="rounded-[5px] border border-[#E7E0D4] bg-[#F5F1EA] px-1.5 py-0.5 text-[11px] text-[#57534E]">
            ⌘K
          </kbd>
        </div>

        <div className="mb-2 mt-4 px-3 text-[11px] font-semibold tracking-[0.08em] text-[#A8A29E]">
          GENERAL
        </div>
        <nav>
          <Link
            href="/dashboard"
            onClick={onClose}
            className="mb-0.5 flex items-center gap-2.5 rounded-[9px] bg-[#FFF7ED] px-3 py-[9px] text-sm font-medium text-[#9A3412]"
          >
            ▦ Panel principal
          </Link>
          <Link
            href="#"
            onClick={onClose}
            className="mb-0.5 flex items-center gap-2.5 rounded-[9px] px-3 py-[9px] text-sm font-medium text-[#57534E] opacity-60"
          >
            ⬢ Proyectos
          </Link>
          <Link
            href="#"
            onClick={onClose}
            className="mb-0.5 flex items-center gap-2.5 rounded-[9px] px-3 py-[9px] text-sm font-medium text-[#57534E] opacity-60"
          >
            ◈ Plantillas
          </Link>
        </nav>

        <div className="mb-2 mt-4 px-3 text-[11px] font-semibold tracking-[0.08em] text-[#A8A29E]">
          CUENTA
        </div>
        <nav>
          <Link
            href="#"
            onClick={onClose}
            className="mb-0.5 flex items-center gap-2.5 rounded-[9px] px-3 py-[9px] text-sm font-medium text-[#57534E] opacity-60"
          >
            ⚙ Configuración
          </Link>
        </nav>

        <SideNavUserData />
      </aside>
    </>
  );
}

export default SideNav;
