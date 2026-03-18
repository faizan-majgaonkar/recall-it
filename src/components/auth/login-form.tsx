"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = searchParams.get("next") || "/documents";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Unable to log in");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label 
          htmlFor="email" 
          className="text-sm font-medium"
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          required
          className="h-11 sm:h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label 
            htmlFor="password" 
            className="text-sm font-medium"
          >
            Password
          </Label>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          required
          className="h-11 sm:h-10 text-base sm:text-sm"
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2.5">
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        </div>
      )}

      <div className="pt-1">
        <Button 
          type="submit" 
          className="w-full h-11 sm:h-10 text-base sm:text-sm font-medium" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground pt-1">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-foreground hover:underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
