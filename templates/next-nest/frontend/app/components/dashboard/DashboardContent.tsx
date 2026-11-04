"use client";
import { useAuth } from "@/components/auth-provider";

function DashboardContent() {
  const { user } = useAuth();

  function shortId(id: string | undefined) {
    if (!id) return "-";
    return id.length > 9 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
  }
  function initials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("");
  }

  return (
    <div className="min-w-0 flex-1 px-5 py-6 lg:px-9 lg:py-[30px]">
      <p className="mb-1.5 text-[13px] text-[#A8A29E]">
        {{PROJECT_TITLE}} / Panel principal
      </p>
      <h1 className="mb-1.5 text-[28px] font-bold leading-[1.2] tracking-[-0.02em]">
        Buenas tardes,{" "}
        <span className="font-serif text-[30px] font-normal italic text-[#EA580C]">
          {user?.name}
        </span>
      </h1>
      <p className="mb-[26px] text-[15.5px] leading-[1.55] text-[#57534E]">
        Tu sesión está activa y tu aplicación está lista para usarse.
      </p>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* Tarjeta de sesión con datos reales de /me */}
        <div className="rounded-[20px] border border-[#E7E0D4] bg-white p-6 shadow-[0_1px_2px_rgb(28_25_23/0.05),0_8px_24px_rgb(28_25_23/0.06)]">
          <h3 className="mb-3.5 text-[15px] font-bold">
            Sesión · datos reales de /me
          </h3>
          <div className="flex items-center justify-between border-b border-[#F5F1EA] py-2 text-sm last:border-0">
            <span className="text-[#57534E]">Nombre</span>
            <span>{user?.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#F5F1EA] py-2 text-sm last:border-0">
            <span className="text-[#57534E]">Correo</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#F5F1EA] py-2 text-sm last:border-0">
            <span className="text-[#57534E]">ID</span>
            <span className="rounded-md bg-[#F5F1EA] px-[7px] py-[3px] font-mono text-xs">
              {shortId(user?.id)}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-[#F5F1EA] py-2 text-sm last:border-0">
            <span className="text-[#57534E]">Token</span>
            <span className="rounded-md bg-[#F5F1EA] px-[7px] py-[3px] font-mono text-xs">
              httpOnly · first-party
            </span>
          </div>
        </div>

        {/* Columna derecha: estado vacío + próximos pasos */}
        <div>
          <div className="rounded-[20px] border-[1.5px] border-dashed border-[#E7E0D4] bg-white px-6 py-[30px] text-center">
            <div className="mb-2.5 text-[26px]">⬢</div>
            <h3 className="mb-1.5 text-[15px] font-bold">
              Todavía no tienes proyectos
            </h3>
            <p className="mb-[18px] text-[13.5px] leading-[1.55] text-[#57534E]">
              Este es el panel de tu aplicación. Empieza por aquí y construye encima.
            </p>
            <button className="h-11 rounded-[10px] border border-[#1C1917] bg-[#1C1917] px-[22px] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgb(28_25_23/0.2)] transition hover:-translate-y-px hover:bg-[#0C0A09] hover:shadow-[0_6px_16px_rgb(28_25_23/0.2)]">
              Empieza ahora
            </button>
          </div>
          <div className="mt-4 rounded-[20px] border border-[#E7E0D4] bg-white p-6 shadow-[0_1px_2px_rgb(28_25_23/0.05),0_8px_24px_rgb(28_25_23/0.06)]">
            <h3 className="mb-3.5 text-[15px] font-bold">Próximos pasos</h3>
            <p className="text-[13px] leading-[2] text-[#57534E]">
              <b className="text-[#1C1917]">1 de 4 completado</b>
              <br />✓ Base y auth con cookie httpOnly
              <br />○ Roles y permisos
              <br />○ CRUD de ejemplo end-to-end
              <br />○ Despliegue a producción
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F5F1EA]">
              <i className="block h-full w-1/4 rounded-full bg-[linear-gradient(90deg,#F97316,#EA580C)]"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;
