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
        <span className="sr-only">Open menu</span>
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

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/40"
            onClick={closeMenu}
          />

          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-l bg-background p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-semibold tracking-tight">Recall It</p>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={closeMenu}
              >
                <span className="sr-only">Close menu</span>
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

            {user ? (
              <div className="mt-6 rounded-lg border p-4">
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            ) : null}

            <nav className="mt-6 flex flex-col gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
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

            <div className="mt-auto pt-6">
              {user ? (
                <LogoutButton className="w-full" onLoggedOut={closeMenu} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
