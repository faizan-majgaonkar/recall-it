import { z } from "zod";

export const generateQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Quiz title is required")
    .max(200, "Quiz title must be at most 200 characters")
    .optional()
    .default("Generated Quiz"),
  questionCount: z
    .number()
    .int()
    .min(5, "Question count must be at least 5")
    .max(20, "Question count must be at most 20"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  selectedConceptIds: z.array(z.string().uuid()).optional().default([]),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
