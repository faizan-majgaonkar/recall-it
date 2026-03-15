import { Container } from "@/components/layout/container";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen py-10 sm:py-16">
      <Container size="sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-xl border bg-background p-6 shadow-sm">
            {children}
          </div>
        </div>
      </Container>
    </main>
  );
}
