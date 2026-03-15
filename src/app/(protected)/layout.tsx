import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedUser();

  return <div className="min-h-screen bg-background">{children}</div>;
}
