import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authenticated";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to continue to your documents and study progress."
    >
      <LoginForm />
    </AuthShell>
  );
}
