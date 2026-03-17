import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().uuid("questionId must be a valid UUID"),
  selectedOptionId: z.string().uuid("selectedOptionId must be a valid UUID"),
});

export const submitQuizSchema = z.object({
  answers: z
    .array(answerSchema)
    .min(1, "At least one answer is required")
    .max(25, "Too many answers"),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
