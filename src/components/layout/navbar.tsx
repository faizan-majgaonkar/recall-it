import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";
import { MobileNav } from "./mobile-nav";

type NavbarProps = {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="border-b bg-background">
      <Container size="xl">
        <div className="flex min-h-16 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              Recall It
            </Link>

            <nav className="hidden items-center gap-4 md:flex">
              {user ? (
                <nav className="hidden items-center gap-4 md:flex">
                  <Link
                    href="/documents"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Documents
                  </Link>
                </nav>
              ) : null}
            </nav>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                </div>

                <LogoutButton />
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  render={<Link href="/login">Log in</Link>}
                />
                <Button render={<Link href="/signup">Sign up</Link>} />
              </>
            )}
          </div>

          <MobileNav user={user} />
        </div>
      </Container>
    </header>
  );
}
