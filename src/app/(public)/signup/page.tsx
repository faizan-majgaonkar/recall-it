import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authenticated";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      title="Create your account"
      description="Sign up to start uploading documents and tracking your understanding."
    >
      <SignupForm />
    </AuthShell>
  );
}
