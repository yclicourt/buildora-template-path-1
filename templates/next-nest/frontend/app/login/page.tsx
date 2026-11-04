import LoginForm from "../components/login/LoginForm";
import LoginHero from "../components/login/LoginHero";

function LoginPage() {
  return (
    <>
      <main className="flex min-h-dvh w-full">
        {/* Columna izquierda (siempre visible) */}
        <LoginForm />

        {/* Columna derecha (solo desktop) */}
        <LoginHero />
      </main>
    </>
  );
}

export default LoginPage;
