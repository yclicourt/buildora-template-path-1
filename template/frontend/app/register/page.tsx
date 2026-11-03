import RegisterForm from "../components/register/RegisterForm";
import RegisterHero from "../components/register/RegisterHero";

function RegisterPage() {
  return (
    <main className="flex min-h-dvh w-full">
      <RegisterForm />
      <RegisterHero />
    </main>
  );
}

export default RegisterPage;
