"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
  onLoggedOut?: () => void;
};

export function LogoutButton({ className, onLoggedOut }: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      onLoggedOut?.();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      variant="destructive-outline"
      onClick={handleLogout}
      disabled={isSubmitting}
      className={className}
    >
      {isSubmitting ? "Logging out..." : "Log out"}
    </Button>
  );
}
