type AnswerInput = {
  questionId: string;
  isCorrect: boolean;
};

type QuestionInput = {
  id: string;
  primaryConceptId: string;
  secondaryConceptIds: string | null; // serialized JSON array of concept IDs
};

type ConceptInput = {
  id: string;
  name: string;
  summary: string | null;
};

export type WeakConcept = {
  conceptId: string;
  name: string;
  summary: string | null;
  primaryMisses: number;
  weightedScore: number; // primary misses (1.0) + secondary misses (0.5)
};

function parseSecondaryIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function computeWeakConcepts(input: {
  answers: AnswerInput[];
  questions: QuestionInput[];
  concepts: ConceptInput[];
}): WeakConcept[] {
  const questionById = new Map(input.questions.map((q) => [q.id, q]));
  const conceptById = new Map(input.concepts.map((c) => [c.id, c]));

  const weightedScores = new Map<string, number>();
  const primaryMissCount = new Map<string, number>();

  for (const answer of input.answers) {
    if (answer.isCorrect) continue;

    const question = questionById.get(answer.questionId);
    if (!question) continue;

    // Primary concept — full weight
    weightedScores.set(
      question.primaryConceptId,
      (weightedScores.get(question.primaryConceptId) ?? 0) + 1.0,
    );
    primaryMissCount.set(
      question.primaryConceptId,
      (primaryMissCount.get(question.primaryConceptId) ?? 0) + 1,
    );

    // Secondary concepts — half weight (supporting signal, not primary cause)
    for (const secondaryId of parseSecondaryIds(question.secondaryConceptIds)) {
      weightedScores.set(
        secondaryId,
        (weightedScores.get(secondaryId) ?? 0) + 0.5,
      );
    }
  }

  // Only surface concepts that were a primary miss at least once
  return Array.from(primaryMissCount.entries())
    .map(([conceptId, primaryMisses]) => {
      const concept = conceptById.get(conceptId);
      if (!concept) return null;

      return {
        conceptId,
        name: concept.name,
        summary: concept.summary,
        primaryMisses,
        weightedScore: weightedScores.get(conceptId) ?? primaryMisses,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.weightedScore - a.weightedScore);
}
