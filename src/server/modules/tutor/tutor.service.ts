import { openai } from "@/lib/ai/openai";
import { env } from "@/lib/env";
import {
  retrieveRelevantChunks,
  type RetrievedChunk,
} from "./retrieval.service";
import {
  createTutorSession,
  createTutorMessage,
  findTutorSessionByIdForUser,
  listMessagesBySessionId,
  getMessageCount,
} from "@/server/repositories/tutor-session.repository";
import { listConceptsByDocumentId } from "@/server/repositories/concept.repository";

function buildSystemPrompt(input: {
  weakConceptNames: string[];
  isFirstMessage: boolean;
}) {
  const conceptContext =
    input.weakConceptNames.length > 0
      ? `\n\nThe student recently completed a quiz and struggled with these concepts:\n${input.weakConceptNames.map((c) => `- ${c}`).join("\n")}\n\nWhen greeting the student, acknowledge these weak areas warmly and offer to explain them. Prioritise these topics in your explanations.`
      : "";

  return `You are a patient, encouraging, and polite AI tutor. Your role is to help the student understand material from their study document.

IMPORTANT: The source material below is a relevant excerpt from the student's document, not the full document. If the excerpts touch on the topic even partially, do your best to answer using what's provided.

RULES:
1. Base your answers on the source material provided in the context below. Do not invent facts or use external knowledge.
2. If the provided excerpts contain information related to the question, answer using that information — even if it doesn't cover every detail.
3. If the excerpts genuinely contain nothing related to the question, say: "I couldn't find relevant sections about that in the excerpts I have. Could you rephrase your question, or ask about a specific part of the material?"
4. If the student asks something inappropriate or completely unrelated to studying, gently redirect: "I'm here to help you study! Let's focus on the material from your document."
5. Always cite which section your answer comes from when possible (e.g. "According to the section on X...").
6. Explain concepts in flowing paragraphs, like a teacher talking to a student. Avoid bullet points and numbered lists — write naturally and conversationally instead.
7. Use clear, simple language. If a concept is complex, rephrase it in everyday terms or use an analogy.
8. Be encouraging — praise effort and progress.
9. Ask follow-up questions to check understanding when appropriate.${conceptContext}${input.isFirstMessage ? "\n\nThis is the start of the conversation. Greet the student warmly, mention the areas they need to work on (if any), and offer to begin explaining the first weak concept." : ""}`;
}

function buildGreeting(input: {
  weakConceptNames: string[];
  hasQuizSession: boolean;
}) {
  if (input.weakConceptNames.length > 0) {
    const conceptList = input.weakConceptNames.join(", ");
    return `Great job finishing the quiz! I can see you need to work on **${conceptList}**. Would you like me to explain these to you?`;
  }

  if (input.hasQuizSession) {
    return "Great job finishing the quiz! How can I help you study today?";
  }

  return "Hi there! I'm your AI tutor for this document. Ask me anything about the material and I'll explain it using your source content.";
}

function buildContextBlock(chunks: RetrievedChunk[]) {
  if (chunks.length === 0) return "";

  return (
    "\n\n--- SOURCE MATERIAL ---\n" +
    chunks
      .map(
        (c, i) =>
          `[Section ${i + 1}${c.sectionTitle ? `: ${c.sectionTitle}` : ""}]\n${c.text}`,
      )
      .join("\n\n") +
    "\n--- END SOURCE MATERIAL ---"
  );
}

export async function startTutorSession(input: {
  documentId: string;
  userId: string;
  quizSessionId?: string;
  weakConceptIds?: string[];
}) {
  const weakConceptIds = input.weakConceptIds ?? [];

  const session = await createTutorSession({
    documentId: input.documentId,
    userId: input.userId,
    quizSessionId: input.quizSessionId ?? null,
    weakConceptIds:
      weakConceptIds.length > 0 ? JSON.stringify(weakConceptIds) : null,
  });

  let weakConceptNames: string[] = [];
  if (weakConceptIds.length > 0) {
    const allConcepts = await listConceptsByDocumentId(input.documentId);
    const idSet = new Set(weakConceptIds);
    weakConceptNames = allConcepts
      .filter((c) => idSet.has(c.id))
      .map((c) => c.name);
  }

  const greeting = buildGreeting({
    weakConceptNames,
    hasQuizSession: Boolean(input.quizSessionId),
  });

  await createTutorMessage({
    sessionId: session.id,
    role: "assistant",
    content: greeting,
    orderIndex: 0,
  });

  return {
    sessionId: session.id,
    greeting,
    sourceChunks: [] as RetrievedChunk[],
  };
}

export async function sendTutorMessage(input: {
  sessionId: string;
  userId: string;
  message: string;
  documentId: string;
}) {
  const session = await findTutorSessionByIdForUser({
    sessionId: input.sessionId,
    userId: input.userId,
  });

  if (!session) {
    throw new Error("Tutor session not found");
  }

  const weakConceptIds: string[] = session.weakConceptIds
    ? JSON.parse(session.weakConceptIds)
    : [];

  let weakConceptNames: string[] = [];
  if (weakConceptIds.length > 0) {
    const allConcepts = await listConceptsByDocumentId(session.documentId);
    const idSet = new Set(weakConceptIds);
    weakConceptNames = allConcepts
      .filter((c) => idSet.has(c.id))
      .map((c) => c.name);
  }

  const chunks = await retrieveRelevantChunks({
    query: input.message,
    documentId: input.documentId,
    topK: 10,
  });

  const previousMessages = await listMessagesBySessionId(input.sessionId);
  const messageCount = previousMessages.length;

  const conversationHistory = previousMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const systemPrompt = buildSystemPrompt({
    weakConceptNames,
    isFirstMessage: false,
  });

  const response = await openai.responses.create({
    model: env.OPENAI_QUESTION_MODEL,
    input: [
      { role: "developer", content: systemPrompt + buildContextBlock(chunks) },
      ...conversationHistory,
      { role: "user", content: input.message },
    ],
  });

  const assistantReply = response.output_text;
  const chunkIds = chunks.map((c) => c.chunkId);

  await createTutorMessage({
    sessionId: input.sessionId,
    role: "user",
    content: input.message,
    orderIndex: messageCount,
  });

  await createTutorMessage({
    sessionId: input.sessionId,
    role: "assistant",
    content: assistantReply,
    sourceChunkIds: JSON.stringify(chunkIds),
    orderIndex: messageCount + 1,
  });

  return {
    reply: assistantReply,
    sourceChunks: chunks,
  };
}
