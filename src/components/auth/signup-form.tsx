"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Unable to create account");
        return;
      }

      router.replace("/documents");
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
          htmlFor="name" 
          className="text-sm font-medium"
        >
          Name
        </Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
          required
          className="h-11 sm:h-10 text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label 
          htmlFor="signup-email" 
          className="text-sm font-medium"
        >
          Email
        </Label>
        <Input
          id="signup-email"
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
        <Label 
          htmlFor="signup-password" 
          className="text-sm font-medium"
        >
          Password
        </Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          required
          className="h-11 sm:h-10 text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground pt-1">
          Must be at least 8 characters
        </p>
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground pt-1">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-foreground hover:underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
