import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

function SideNavLogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  async function onLogout() {
    await logout(); // quema la familia en el backend + borra la cookie
    router.push("/login"); // el provider pone user en null pero NO redirige solo
  }
  return <button onClick={onLogout}>Salir</button>;
}

export default SideNavLogoutButton;
