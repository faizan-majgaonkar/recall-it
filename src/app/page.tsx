import Link from "next/link";
import { Container } from "@/components/layout/container";

const features = [
  {
    icon: "📄",
    title: "Upload your material",
    description:
      "Upload a PDF, DOCX, or TXT file. We extract the text, detect structure, and chunk it into meaningful sections.",
  },
  {
    icon: "🧠",
    title: "Auto-generated quizzes",
    description:
      "AI builds concept-grounded multiple choice questions from your actual document — not generic trivia.",
  },
  {
    icon: "📊",
    title: "Know your weak spots",
    description:
      "After each quiz, see exactly which concepts you struggled with and where to focus your revision.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b bg-background py-20 sm:py-28">
        <Container size="lg">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="inline-flex items-center rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              Document-based knowledge diagnosis
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Know exactly what you&apos;ve learned — and what you haven&apos;t
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Upload your study material, take a grounded quiz, and get a clear
              picture of the concepts you understand versus the ones that need
              more work.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Log in
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <Container size="lg">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-background p-6 shadow-sm"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h2 className="mb-2 font-semibold tracking-tight">
                  {feature.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA strip */}
      <section className="border-t bg-muted/30 py-14">
        <Container size="lg">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold tracking-tight">
              Ready to test your understanding?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Create a free account
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
