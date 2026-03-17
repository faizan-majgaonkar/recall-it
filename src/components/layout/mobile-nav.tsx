"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

type MobileNavProps = {
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

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = user
    ? [{ href: "/documents", label: "Documents" }]
    : [
        { href: "/login", label: "Log in" },
        { href: "/signup", label: "Sign up" },
      ];

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        aria-label="Open navigation menu"
        onClick={() => setIsOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/50"
            onClick={closeMenu}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-l bg-background shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-2 font-semibold tracking-tight"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
                  R
                </span>
                <span>Recall It</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={closeMenu}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
                </svg>
              </Button>
            </div>

            {/* User info */}
            {user && (
              <div className="border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex flex-col gap-1 p-4">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            {user && (
              <div className="mt-auto border-t p-4">
                <LogoutButton className="w-full" onLoggedOut={closeMenu} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
