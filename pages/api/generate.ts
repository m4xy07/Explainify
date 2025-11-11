import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { mockDocResponse } from "@/lib/mock-data";
import type {
  DocGenerationRequest,
  DocGenerationResponse,
} from "@/types/generation";

const bodySchema = z.object({
  api_data: z.record(z.string(), z.any()),
  audience_focus: z.string().min(1),
});

const geminiEndpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function callGemini({
  api_data,
  audience_focus,
}: DocGenerationRequest): Promise<DocGenerationResponse> {
  const prompt = `
You are Explainify, an AI that rewrites API specifications for different audiences.
Given the following API data:
${JSON.stringify(api_data, null, 2)}

And the target audience: ${audience_focus}
The Information should be according to the audience's level of expertise and field. If student then focus on clarity and simplicity. If developer, include technical details and practical examples. If expert, emphasize advanced concepts and nuanced insights., if security researcher then focus on vulnerabilities, threat models, and mitigation strategies. If developer advocate then focus on best practices, integration tips, and real-world applications.

Generate 3 documentation outputs:
1. Beginner-friendly documentation
2. Advanced-level detailed documentation
3. Expert-specific documentation

Then create a short podcast-style conversation between Alex (the learner) and Jamie (the expert) explaining this API in a simple, conversational tone.

Return all outputs as JSON with these keys:
{ "version_1", "version_2", "version_3", "dialogue_script" }
`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`${geminiEndpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
      },
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `Gemini error: ${response.status} ${response.statusText} :: ${errorPayload}`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const content =
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part?.text ?? "")
      .join("\n") ?? "";

  const cleaned = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as DocGenerationResponse;
  return parsed;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DocGenerationResponse & { usedMock?: boolean; message?: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ...mockDocResponse, message: "Method not allowed", usedMock: true });
  }

  const parsed = bodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ...mockDocResponse,
      usedMock: true,
      message: "Invalid request body.",
    });
  }

  const { api_data, audience_focus } = parsed.data;

  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    if (!geminiKey) {
      return res.status(200).json({
        ...mockDocResponse,
        usedMock: true,
        message: "GEMINI_API_KEY missing. Served mock response.",
      });
    }

    const payload = await callGemini({ api_data, audience_focus });
    return res.status(200).json({
      ...payload,
      usedMock: false,
    });
  } catch (error) {
    console.error("generate API error", error);
    const message =
      error instanceof Error && error.message.includes("429")
        ? "Gemini rate limit detected — serving mock data while it recovers."
        : "Fallback response applied after API failure.";
    const statusCode =
      error instanceof Error && error.message.includes("429") ? 429 : 500;

    return res.status(statusCode).json({
      ...mockDocResponse,
      usedMock: true,
      message,
    });
  }
}
