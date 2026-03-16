import { z } from "zod";

export const documentUploadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
