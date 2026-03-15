import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen py-10">
      <Container size="lg">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">Recall It</h1>
            <p className="text-muted-foreground">
              Upload a document, test your understanding, and identify weak
              concepts.
            </p>
          </div>

          <div className="flex gap-3">
            <Button render={<Link href="/signup">Get started</Link>} />

            <Button
              variant="outline"
              render={<Link href="/login">Log in</Link>}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
