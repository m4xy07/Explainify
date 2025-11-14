import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(5),
  context: z.string().optional(),
  persona: z.string().optional(),
});

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

function buildPrompt(question: string, context?: string, persona?: string) {
  return `
You are Explainify Answers, a concise technical assistant.
Persona: ${persona ?? "General API consumer"}

Context (optional):
${context ?? "N/A"}

Question:
${question}

Respond with:
- A helpful answer (2-3 paragraphs max).
- A short list titled "Next questions to explore" with up to 3 bullet points.
`;
}

const mockAnswer = {
  answer:
    "This API exposes REST endpoints for managing tasks. Authenticate with a bearer token, then call `GET /tasks` to list entries or `POST /tasks` with a JSON body to create new ones.",
  followUps: [
    "How do I paginate or filter the task list?",
    "What errors should I handle for rate limits?",
    "Can I subscribe to webhook events for task updates?",
  ],
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    answer: string;
    followUps: string[];
    usedMock?: boolean;
    message?: string;
  }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ...mockAnswer,
      usedMock: true,
      message: "Method not allowed",
    });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ...mockAnswer,
      usedMock: true,
      message: "Invalid question payload.",
    });
  }

  const { question, context, persona } = parsed.data;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      ...mockAnswer,
      usedMock: true,
      message: "GEMINI_API_KEY missing. Served mock answer.",
    });
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(question, context, persona) }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Gemini query error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text =
      data.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part?.text ?? "")
        .join("\n") ?? "";

    const sections = text.split("Next questions to explore");
    const answer = sections[0]?.trim() || mockAnswer.answer;

    const followUps: string[] =
      sections[1]
        ?.split(/\n|-/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3) ?? mockAnswer.followUps;

    return res.status(200).json({
      answer,
      followUps,
      usedMock: false,
    });
  } catch (error) {
    console.error("query API error", error);
    return res.status(200).json({
      ...mockAnswer,
      usedMock: true,
      message: "Served mock answer after query failure.",
    });
  }
}
