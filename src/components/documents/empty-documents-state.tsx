import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyDocumentsState() {
  return (
    <div className="rounded-xl border border-dashed bg-background p-8 text-center sm:p-10">
      <div className="mx-auto max-w-md space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          No documents yet
        </h2>

        <p className="text-sm text-muted-foreground sm:text-base">
          Upload your first study document to start building question banks and
          analyzing your understanding.
        </p>
      </div>
    </div>
  );
}
