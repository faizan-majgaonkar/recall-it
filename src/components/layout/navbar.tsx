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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <Container size="xl">
        <div className="flex min-h-16 items-center justify-between gap-4">
          {/* Left: logo + nav links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
                R
              </span>
              <span>Recall It</span>
            </Link>

            {user && (
              <nav className="hidden items-center gap-1 md:flex">
                <Link
                  href="/documents"
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Documents
                </Link>
              </nav>
            )}
          </div>

          {/* Right: auth actions */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {getInitials(user.name)}
                  </span>
                  <span className="text-sm font-medium">{user.name}</span>
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
