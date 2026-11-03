function RegisterHero() {
  return (
    <aside className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#14100E,#2A1A12)] p-11 text-white before:absolute before:inset-0 before:bg-[linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] before:bg-[size:44px_44px] before:content-[''] before:[mask-image:radial-gradient(ellipse_at_70%_15%,black_25%,transparent_75%)] after:absolute after:-right-[120px] after:-top-[140px] after:h-[420px] after:w-[420px] after:rounded-full after:bg-[radial-gradient(circle,rgb(234_88_12/0.28),transparent_65%)] after:content-[''] lg:flex lg:w-1/2 lg:flex-col lg:justify-center [&>*]:relative">
      <div>
        <span className="mb-[22px] inline-block rounded-full border border-[#EA580C]/35 bg-[#EA580C]/16 px-3 py-[5px] text-xs font-semibold tracking-[0.04em] text-[#FDBA74]">
          {{PROJECT_TITLE}}
        </span>
      </div>
      <h2 className="max-w-[400px] text-[30px] font-bold leading-[1.2] tracking-[-0.02em]">
        Una base sólida,{" "}
        <span className="font-serif text-[32px] font-normal italic text-[#FDBA74]">
          desde el primer commit.
        </span>
      </h2>
      <p className="mt-3.5 max-w-[400px] text-[15px] leading-[1.6] text-[#D6D3D1]">
        Arquitectura hexagonal y Docker desde el día uno. Tú te
        concentras en el producto.
      </p>
      <div className="relative mt-[30px]">
        <div className="rounded-[14px] border border-white/12 bg-[#0C0A09] px-4 py-3.5 font-mono text-[13px] leading-[1.8] text-[#D6D3D1] shadow-[0_16px_40px_rgb(0_0_0/0.45)]">
          <span className="tracking-[4px] text-[#57534E]">● ● ●</span>
          <br />
          <span className="text-[#FDBA74]">$</span> docker compose up{" "}
          <span className="text-[#78716C]"># postgres + redis</span>
          <br />
          <span className="text-[#FDBA74]">$</span> pnpm dev{" "}
          <span className="text-[#78716C]"># frontend + backend</span>
          <br />
          <span className="text-[#86EFAC]">
            ✓ listo en http://localhost:{{FRONTEND_PORT}}
          </span>
        </div>
        <div className="-mt-3.5 ml-7 rounded-[14px] border border-white/12 bg-[#1C1917] px-4 py-3.5 font-mono text-[12.5px] leading-[1.9] text-[#D6D3D1] shadow-[0_16px_40px_rgb(0_0_0/0.4)]">
          <span className="text-[#78716C]">auth/</span>
          <br />
          ├─ <span className="text-[#34D399]">✓</span> login · refresh con
          rotación
          <br />
          ├─ <span className="text-[#34D399]">✓</span> logout con family-burn
          <br />
          └─ <span className="text-[#34D399]">✓</span> cookie httpOnly
          first-party
        </div>
      </div>
      <div className="mt-[30px] flex flex-col gap-3.5">
        <div className="flex gap-3 text-sm leading-[1.5] text-[#D6D3D1]">
          <span className="flex h-[26px] w-[26px] min-w-[26px] items-center justify-center rounded-lg border border-[#EA580C]/30 bg-[#EA580C]/16 text-sm text-[#FDBA74]">
            ⬢
          </span>
          <span>
            <b className="text-white">Sin decisiones aburridas:</b> la
            estructura ya viene resuelta.
          </span>
        </div>
        <div className="flex gap-3 text-sm leading-[1.5] text-[#D6D3D1]">
          <span className="flex h-[26px] w-[26px] min-w-[26px] items-center justify-center rounded-lg border border-[#EA580C]/30 bg-[#EA580C]/16 text-sm text-[#FDBA74]">
            ✓
          </span>
          <span>
            <b className="text-white">Listo para producción:</b> Docker, CI y
            despliegue incluidos.
          </span>
        </div>
        <div className="flex gap-3 text-sm leading-[1.5] text-[#D6D3D1]">
          <span className="flex h-[26px] w-[26px] min-w-[26px] items-center justify-center rounded-lg border border-[#EA580C]/30 bg-[#EA580C]/16 text-sm text-[#FDBA74]">
            ◈
          </span>
          <span>
            <b className="text-white">Tests incluidos:</b> nada se publica
            sin compilar.
          </span>
        </div>
      </div>
      <p className="mt-7 text-[12.5px] tracking-[0.02em] text-[#A8A29E]">
        Hecho con Next.js + NestJS + Prisma
      </p>
    </aside>
  );
}

export default RegisterHero;
