import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import type { FlowchartResponse } from "@/types/flowchart";

const bodySchema = z.object({
  doc_content: z.string().min(10),
  audience_focus: z.string().min(1),
});

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

const FLOW_PROMPT = (content: string, audience: string) => `
You are Explainify Flow-Maker. Turn the following documentation content into a concise roadmap / flowchart.
Audience: ${audience}
Documentation:
${content}

Rules:
- Return ONLY valid JSON with keys: summary (string), nodes (array), edges (array).
- nodes = [{ "id": "string", "title": "string", "description": "string", "category": "optional string" }]
- edges = [{ "source": "nodeId", "target": "nodeId", "label": "optional string" }]
- Create 4-8 nodes ordered from beginner concepts to advanced integrations.
- Edges should describe dependencies (from foundation to advanced).
- Avoid markdown, code fences, or commentary outside JSON.
`;

const mockFlow: FlowchartResponse = {
  summary:
    "Start by understanding the API surface, then create use-case specific payloads, test them, and finally automate roll-outs with monitoring.",
  nodes: [
    {
      id: "discover",
      title: "Discovery",
      description: "Review endpoints, auth, and rate limits for your persona.",
      category: "foundation",
    },
    {
      id: "model",
      title: "Domain Modeling",
      description: "Map API objects to your internal models and workflows.",
      category: "design",
    },
    {
      id: "prototype",
      title: "Prototype Requests",
      description: "Craft sample requests/responses in a dedicated workspace.",
      category: "build",
    },
    {
      id: "validate",
      title: "Validation & Testing",
      description: "Add schema validation, test harnesses, and security checks.",
      category: "quality",
    },
    {
      id: "deploy",
      title: "Automation & Monitoring",
      description: "Automate deployments and plug into observability dashboards.",
      category: "scale",
    },
  ],
  edges: [
    { source: "discover", target: "model", label: "Define data surface" },
    { source: "model", target: "prototype", label: "Implement flows" },
    { source: "prototype", target: "validate", label: "Harden" },
    { source: "validate", target: "deploy", label: "Ship & observe" },
  ],
};

async function callGemini(
  doc_content: string,
  audience_focus: string
): Promise<FlowchartResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: FLOW_PROMPT(doc_content, audience_focus) }],
        },
      ],
      generationConfig: {
        temperature: 0.55,
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(
      `Gemini flow error: ${response.status} ${response.statusText} :: ${payload}`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
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

  const parsed = JSON.parse(cleaned) as FlowchartResponse;
  return parsed;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    FlowchartResponse & { usedMock?: boolean; message?: string }
  >
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ...mockFlow, usedMock: true, message: "Method not allowed" });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ...mockFlow,
      usedMock: true,
      message: "Invalid request body",
    });
  }

  const { doc_content, audience_focus } = parsed.data;
  try {
    const result = await callGemini(doc_content, audience_focus);
    return res.status(200).json({
      ...result,
      usedMock: false,
    });
  } catch (error) {
    console.error("flowchart API error", error);
    return res.status(200).json({
      ...mockFlow,
      usedMock: true,
      message: "Served mock flowchart while generation failed.",
    });
  }
}
