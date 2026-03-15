import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function DocumentsPage() {
  const user = await requireAuthenticatedUser();

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-2 text-muted-foreground">Welcome back, {user.name}.</p>
      </div>
    </main>
  );
}
