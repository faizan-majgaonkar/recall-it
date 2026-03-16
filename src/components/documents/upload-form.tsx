"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadResponse = {
  success: boolean;
  message?: string;
  document?: {
    id: string;
  };
};

export function UploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!file) {
      setErrorMessage("Please select a PDF file");
      return;
    }

    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF files are supported");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to upload document");
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
      <div className="space-y-2">
        <Label htmlFor="title">Document title</Label>
        <Input
          id="title"
          type="text"
          placeholder="Enter a title for this document"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">PDF file</Label>
        <Input
          id="file"
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            setFile(selectedFile);
          }}
          disabled={isSubmitting}
          required
        />
        <p className="text-xs text-muted-foreground">
          Upload a PDF file up to 15 MB.
        </p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload document"}
      </Button>
    </form>
  );
}
