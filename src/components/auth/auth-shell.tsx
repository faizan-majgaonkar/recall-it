import { Container } from "@/components/layout/container";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Container size="sm">
        <div className="space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-xl border bg-background p-7 shadow-sm">
            {children}
          </div>
        </div>
      </Container>
    </main>
  );
}
