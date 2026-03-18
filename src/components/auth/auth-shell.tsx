import { Container } from "@/components/layout/container";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6">
      <Container size="sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="rounded-xl border bg-background p-6 sm:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </Container>
    </main>
  );
}
