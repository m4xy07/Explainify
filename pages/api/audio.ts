import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import path from "path";
import { promises as fs } from "fs";
import os from "os";
import { exec as execCallback } from "child_process";
import { promisify } from "util";

import { normalizeDocContent } from "@/lib/utils";

const exec = promisify(execCallback);

const requestSchema = z.object({
  dialogue_script: z.string().min(1).optional(),
  variant_content: z.string().optional(),
  variant_label: z.string().optional(),
  variant_key: z.enum(["version_1", "version_2", "version_3"]).optional(),
});

const elevenEndpoint = "https://api.elevenlabs.io/v1/text-to-speech";
const geminiEndpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const DEFAULT_VOICES = {
  alex: "EXAVITQu4vr4xnSDxMaL",
  jamie: "pNInz6obpgDQGcFmaJgB",
};

interface DialogueSegment {
  speaker: "Alex" | "Jamie";
  text: string;
}

function parseDialogue(script: string): DialogueSegment[] {
  const lines = script.split("\n").map((line) => line.trim());
  let fallbackSpeaker: "Alex" | "Jamie" = "Alex";

  return lines
    .filter(Boolean)
    .map((line) => {
      const [rawSpeaker, ...rest] = line.split(":");
      const hasExplicitSpeaker = rest.length > 0;
      const text = hasExplicitSpeaker ? rest.join(":").trim() : line;
      let speaker: "Alex" | "Jamie" = fallbackSpeaker;
      if (hasExplicitSpeaker) {
        const candidate = rawSpeaker.trim().toLowerCase();
        if (candidate.includes("jamie")) speaker = "Jamie";
        else speaker = "Alex";
      } else {
        speaker = fallbackSpeaker;
      }
      fallbackSpeaker = speaker === "Alex" ? "Jamie" : "Alex";
      return {
        speaker,
        text,
      };
    })
    .filter((segment) => segment.text.length > 0);
}

function scriptFromDoc(
  content?: string,
  label?: string
): string | undefined {
  if (!content) return undefined;
  const cleaned = content
    .replace(/\s+/g, " ")
    .replace(/\*\*/g, "")
    .trim();
  if (!cleaned) return undefined;

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 6);

  if (sentences.length === 0) return undefined;

  const friendlyLabel = label ?? "this documentation";
  const header = `Jamie: Want a quick walkthrough of the ${friendlyLabel} version?`;
  const lines = [header];

  sentences.forEach((sentence, index) => {
    const speaker = index % 2 === 0 ? "Alex" : "Jamie";
    lines.push(`${speaker}: ${sentence}`);
  });

  lines.push(
    `Jamie: That's the heart of the ${friendlyLabel} flow. Ready to ship it?`
  );

  return lines.join("\n");
}

async function createGeminiDialogue(content: string, label?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;
  const prompt = `
You are Explainify, an AI host that turns documentation into an approachable podcast.
Using the following documentation targeted for ${label ?? "this audience"}:
${content}

Produce a short back-and-forth between Alex (curious learner) and Jamie (knowledgeable guide).
Keep it under 12 lines, alternate speakers, and return plain text in the format:
Alex: ...
Jamie: ...
`;

  const response = await fetch(`${geminiEndpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
      },
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `Gemini dialogue error: ${response.status} ${response.statusText} :: ${errorPayload}`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text =
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part?.text ?? "")
      .join("\n")
      .trim() ?? "";

  return text || undefined;
}

async function synthesizeSegment(
  segment: DialogueSegment,
  apiKey: string
): Promise<Buffer> {
  const voiceId =
    segment.speaker === "Alex"
      ? process.env.ELEVENLABS_VOICE_ALEX ?? DEFAULT_VOICES.alex
      : process.env.ELEVENLABS_VOICE_JAMIE ?? DEFAULT_VOICES.jamie;

  const response = await fetch(`${elevenEndpoint}/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: segment.text,
      model_id: "eleven_turbo_v2",
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.4,
      },
      output_format: "mp3_44100_128",
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function ensureAudioDir() {
  const audioDir = path.join(process.cwd(), "public", "audio");
  await fs.mkdir(audioDir, { recursive: true });
  return audioDir;
}

async function concatWithFfmpeg(chunks: string[], output: string) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "explainify-audio-"));
  const listFile = path.join(tmpDir, "inputs.txt");
  const normalized = chunks
    .map((chunkPath) => `file '${chunkPath.replace(/\\/g, "/")}'`)
    .join("\n");
  await fs.writeFile(listFile, normalized);
  await exec(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${output}"`
  );
  await fs.rm(tmpDir, { recursive: true, force: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ audioPath: string; usedMock?: boolean; message?: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      audioPath: "/audio/output.mp3",
      usedMock: true,
      message: "Method not allowed",
    });
  }

  const audioDir = await ensureAudioDir();
  const outputPath = path.join(audioDir, "output.mp3");

  let incoming: unknown = req.body;
  if (typeof incoming === "string") {
    try {
      incoming = incoming === "" ? {} : JSON.parse(incoming);
    } catch (error) {
      console.error("audio request JSON parse error", error);
      incoming = {};
    }
  }

  const parsed = requestSchema.safeParse(incoming);

  if (!parsed.success) {
    await fs.copyFile(path.join(audioDir, "mock.mp3"), outputPath);
    return res.status(200).json({
      audioPath: "/audio/output.mp3",
      usedMock: true,
      message: "Invalid request payload. Served fallback audio.",
    });
  }

  const normalizedVariantContent =
    parsed.data.variant_content !== undefined
      ? normalizeDocContent(parsed.data.variant_content)
      : undefined;

  const normalizedDialogueInput =
    parsed.data.dialogue_script !== undefined
      ? normalizeDocContent(parsed.data.dialogue_script)
      : undefined;

  let finalScript: string | undefined;

  if (normalizedVariantContent) {
    try {
      finalScript = await createGeminiDialogue(
        normalizedVariantContent,
        parsed.data.variant_label
      );
    } catch (error) {
      console.error("generate dialogue via Gemini failed", error);
    }

    if (!finalScript) {
      finalScript = scriptFromDoc(
        normalizedVariantContent,
        parsed.data.variant_label
      );
    }
  }

  if (!finalScript && normalizedDialogueInput) {
    finalScript = normalizedDialogueInput;
  }

  if (!finalScript) {
    await fs.copyFile(path.join(audioDir, "mock.mp3"), outputPath);
    return res.status(200).json({
      audioPath: "/audio/output.mp3",
      usedMock: true,
      message: "Narration missing - served sample audio instead.",
    });
  }

  const segments = parseDialogue(finalScript);
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || segments.length === 0) {
    await fs.copyFile(
      path.join(audioDir, "mock.mp3"),
      outputPath
    );
    return res.status(200).json({
      audioPath: "/audio/output.mp3",
      usedMock: true,
      message: segments.length === 0 ? "No dialogue lines supplied." : "Missing ELEVENLABS_API_KEY. Mock audio returned.",
    });
  }

  try {
    const chunkPaths: string[] = [];
    for (let index = 0; index < segments.length; index += 1) {
      const buffer = await synthesizeSegment(segments[index], apiKey);
      const chunkPath = path.join(audioDir, `chunk-${index}.mp3`);
      await fs.writeFile(chunkPath, buffer);
      chunkPaths.push(chunkPath);
    }

    await concatWithFfmpeg(chunkPaths, outputPath);

    await Promise.all(
      chunkPaths.map((chunkPath) => fs.rm(chunkPath, { force: true }))
    );

    return res.status(200).json({
      audioPath: "/audio/output.mp3",
      usedMock: false,
    });
  } catch (error) {
    console.error("audio API error", error);
    await fs.copyFile(
      path.join(audioDir, "mock.mp3"),
      outputPath
    );
    return res.status(500).json({
      audioPath: "/audio/output.mp3",
      usedMock: true,
      message: "Returned mock audio after synthesis failure.",
    });
  }
}
