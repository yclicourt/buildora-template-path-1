"use client";

import { useAuth } from "@/components/auth-provider";
import SideNavLogoutButton from "./SideNavLogoutButton";

function SideNavUserData() {
  const { user } = useAuth();

  function initials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("");
  }
  return (
    <div className="mt-auto flex items-center gap-2.5 rounded-[14px] border border-[#E7E0D4] p-3">
      <span className="flex h-8 w-8 min-w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F97316,#EA580C)] text-xs font-bold text-white">
        {user ? initials(user.name) : "**"}
      </span>
      <span>
        <b className="block text-[13.5px] text-[#1C1917]">{user?.name}</b>
        <span className="text-xs text-[#A8A29E]">{user?.email}</span>
      </span>
      <SideNavLogoutButton />
    </div>
  );
}

export default SideNavUserData;
