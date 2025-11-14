import Head from "next/head";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Radio,
  RefreshCcw,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

import { ExplainCard, type DownloadFormat } from "@/components/Card";
import { JsonInput } from "@/components/JsonInput";
import { LoadingDots } from "@/components/LoadingDots";
import { RoleSelector } from "@/components/RoleSelector";
import { Button } from "@/components/ui/button";
import { mockApiSpec, mockDocResponse } from "@/lib/mock-data";
import { cn, normalizeDocContent, stripFields } from "@/lib/utils";
import type { AudienceRole, DocGenerationResponse } from "@/types/generation";
import type { FlowchartResponse } from "@/types/flowchart";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const FlowchartViewer = dynamic(
  async () => {
    const mod = await import("@/components/FlowchartViewer");
    return mod.FlowchartViewer;
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-[32px] border border-white/10 bg-black/30 p-6 text-sm text-white/70">
        Preparing flowchart…
      </div>
    ),
  }
);

const cardAccents = ["#7b5cff", "#ff4d67", "#00a1ff"];
type VariantKey = "version_1" | "version_2" | "version_3";

export default function Home() {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(mockApiSpec, null, 2)
  );
  const [selectedRole, setSelectedRole] = useState<AudienceRole>("Student");
  const [customRole, setCustomRole] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocGenerationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);
  const [mockMessage, setMockMessage] = useState<string | null>(null);
  const [audioVariant, setAudioVariant] = useState<VariantKey>("version_1");
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [audioUsedMock, setAudioUsedMock] = useState(false);
  const [lastAudioLabel, setLastAudioLabel] = useState("Beginner");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [flowVariant, setFlowVariant] = useState<VariantKey>("version_1");
  const [flowchart, setFlowchart] = useState<FlowchartResponse | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowMessage, setFlowMessage] = useState<string | null>(null);
  const [flowUsedMock, setFlowUsedMock] = useState(false);
  const flowchartRef = useRef<HTMLDivElement | null>(null);
  const [questionInput, setQuestionInput] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [questionFollowUps, setQuestionFollowUps] = useState<string[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionUsedMock, setQuestionUsedMock] = useState(false);

  const activeAudience =
    selectedRole === "Other" ? customRole.trim() : selectedRole;

  const cards = useMemo(() => {
    const payload = docs ?? mockDocResponse;
    const hiddenFields = ["title", "audience", "audience_level"];
    return [
      {
        key: "version_1" as const,
        title: "Beginner",
        content: stripFields(
          normalizeDocContent(payload.version_1),
          hiddenFields
        ),
        raw: payload.version_1,
      },
      {
        key: "version_2" as const,
        title: "Advanced",
        content: stripFields(
          normalizeDocContent(payload.version_2),
          hiddenFields
        ),
        raw: payload.version_2,
      },
      {
        key: "version_3" as const,
        title: "Expert",
        content: stripFields(
          normalizeDocContent(payload.version_3),
          hiddenFields
        ),
        raw: payload.version_3,
      },
    ];
  }, [docs, activeAudience]);

  const variantOptions = useMemo(
    () => [
      { key: "version_1" as const, label: "Beginner" },
      { key: "version_2" as const, label: "Advanced" },
      {
        key: "version_3" as const,
        label: "Expert",
      },
    ],
    [activeAudience]
  );

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonError(null);
      return parsed;
    } catch {
      setJsonError("JSON is invalid. Please fix the syntax and try again.");
      return null;
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (
    title: string,
    content: string,
    format: DownloadFormat
  ) => {
    const fileBase =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/(^-|-$)/g, "") || "explainify-doc";

    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const wrapped = doc.splitTextToSize(content, usableWidth);
      let cursorY = margin;

      wrapped.forEach((line: string) => {
        if (cursorY > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += 16;
      });

      doc.save(`${fileBase}.pdf`);
      return;
    }

    const mimeType = format === "md" ? "text/markdown" : "text/plain";
    downloadBlob(
      new Blob([content], { type: mimeType }),
      `${fileBase}.${format}`
    );
  };

  const handleGenerate = async () => {
    const parsed = validateJson();
    if (!parsed) {
      toast.error("Hang on — the JSON payload still has issues.");
      return;
    }

    if (!activeAudience) {
      toast.error("Choose or describe an audience before generating.");
      return;
    }

    setLoading(true);
    setAudioPath(null);
    setUsedMock(false);
    setMockMessage(null);
    setAudioVariant("version_1");
    setAudioMessage(null);
    setAudioUsedMock(false);
    setIsAudioPlaying(false);
    setFlowVariant("version_1");
    setFlowchart(null);
    setFlowMessage(null);
    setFlowUsedMock(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_data: parsed,
          audience_focus: activeAudience,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate documentation");
      }

      const payload = (await response.json()) as DocGenerationResponse & {
        usedMock?: boolean;
        message?: string;
      };
      setDocs(payload);
      setUsedMock(Boolean(payload.usedMock));
      setMockMessage(
        payload.usedMock
          ? payload.message ??
              "Explainify is running in demo mode until live keys are detected."
          : null
      );
      toast.success(
        payload.usedMock
          ? "Explainify demo data loaded."
          : "Custom documentation ready!"
      );
    } catch (error) {
      console.error(error);
      setDocs(mockDocResponse);
      setUsedMock(true);
      setMockMessage("Unable to reach the API. Falling back to demo data.");
      toast.error("Falling back to mock content for now.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    const payload = docs ?? mockDocResponse;

    const variantMeta = variantOptions.find(
      (option) => option.key === audioVariant
    );

    let variantRaw: unknown;
    if (audioVariant === "version_1") {
      variantRaw = payload.version_1;
    } else if (audioVariant === "version_2") {
      variantRaw = payload.version_2;
    } else {
      variantRaw = payload.version_3;
    }

    const normalizedVariantContent = normalizeDocContent(variantRaw);

    if (!variantMeta || !normalizedVariantContent) {
      toast.error("Select a documentation track before generating audio.");
      return;
    }

    setAudioLoading(true);
    setAudioMessage("Creating your Explainify podcast…");
    setAudioUsedMock(false);
    setLastAudioLabel(variantMeta.label);
    setIsAudioPlaying(false);

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_content: normalizedVariantContent,
          variant_label: variantMeta.label,
          variant_key: audioVariant,
        }),
      });

      const audioPayload = (await response.json().catch(() => null)) as {
        audioPath: string;
        usedMock?: boolean;
        message?: string;
      };

      if (!response.ok || !audioPayload?.audioPath) {
        throw new Error(
          audioPayload?.message ?? "Audio generation failed. Please retry."
        );
      }

      setAudioPath(`${audioPayload.audioPath}?v=${Date.now()}`);
      setAudioUsedMock(Boolean(audioPayload.usedMock));
      setAudioMessage(
        audioPayload.message ??
          (audioPayload.usedMock
            ? "Served mock podcast sample."
            : `Explainify podcast ready for ${variantMeta.label}.`)
      );
      toast.success(
        audioPayload.usedMock
          ? "Served mock podcast sample."
          : "Explainify podcast ready."
      );
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create audio. Using backup sample.";
      setAudioMessage(message);
      setAudioUsedMock(true);
      setAudioPath(`/audio/mock.mp3?v=${Date.now()}`);
      toast.error(message);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleGenerateFlow = async () => {
    const payload = docs ?? mockDocResponse;
    const variantMeta = variantOptions.find(
      (option) => option.key === flowVariant
    );

    let variantRaw: unknown;
    if (flowVariant === "version_1") variantRaw = payload.version_1;
    else if (flowVariant === "version_2") variantRaw = payload.version_2;
    else variantRaw = payload.version_3;

    const normalized =
      stripFields(normalizeDocContent(variantRaw), [
        "title",
        "audience",
        "audience_level",
      ]) ?? normalizeDocContent(variantRaw);

    if (!variantMeta || !normalized) {
      toast.error("We need valid documentation to craft a roadmap.");
      return;
    }

    setFlowLoading(true);
    setFlowMessage("Sketching your Explainify roadmap…");
    setFlowUsedMock(false);

    try {
      const response = await fetch("/api/flowchart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_content: normalized,
          audience_focus: variantMeta.label,
        }),
      });

      if (!response.ok) {
        throw new Error("Flowchart generation failed");
      }

      const payload = (await response.json()) as FlowchartResponse & {
        usedMock?: boolean;
        message?: string;
      };

      setFlowchart(payload);
      setFlowUsedMock(Boolean(payload.usedMock));
      setFlowMessage(
        payload.message ??
          (payload.usedMock
            ? "Showing demo flow while the live generator recovers."
            : "Flowchart ready.")
      );
    } catch (error) {
      console.error(error);
      setFlowchart(null);
      setFlowUsedMock(true);
      setFlowMessage("Unable to map the flow right now. Try again later.");
      toast.error("Flowchart generation fell back to mock mode.");
    } finally {
      setFlowLoading(false);
    }
  };
  const handleAskQuestion = async () => {
    const trimmed = questionInput.trim();
    if (!trimmed) {
      toast.error("Type a question to get started.");
      return;
    }

    const payload = docs ?? mockDocResponse;
    const context =
      stripFields(
        normalizeDocContent(payload[flowVariant] ?? payload.version_1),
        ["title", "audience", "audience_level"]
      ) ?? normalizeDocContent(payload[flowVariant] ?? payload.version_1) ?? "";

    setQuestionLoading(true);
    setQuestionUsedMock(false);
    setQuestionAnswer(null);
    setQuestionFollowUps([]);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          context,
          persona: variantOptions.find((v) => v.key === flowVariant)?.label,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the answer.");
      }

      const payload = (await response.json()) as {
        answer: string;
        followUps: string[];
        usedMock?: boolean;
        message?: string;
      };

      setQuestionAnswer(payload.answer);
      setQuestionFollowUps(payload.followUps);
      setQuestionUsedMock(Boolean(payload.usedMock));
      if (payload.message) {
        setFlowMessage(payload.message);
      }
    } catch (error) {
      console.error(error);
      setQuestionAnswer(
        "Unable to fetch an answer right now. Try again later."
      );
      setQuestionFollowUps([
        "Which endpoints or schemas does this question depend on?",
        "Are there auth or rate-limit considerations?",
        "What examples or test cases can validate the answer?",
      ]);
      setQuestionUsedMock(true);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleDownloadFlowchart = async (format: "png" | "pdf") => {
    if (!flowchart || !flowchartRef.current) {
      toast.error(
        "Generate the flowchart first before downloading it as an image."
      );
      return;
    }

    try {
      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(flowchartRef.current, {
        cacheBust: true,
      });

      if (format === "png") {
        downloadBlob(
          await (async () => {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            return blob;
          })(),
          `explainify-flow-${flowVariant}.png`
        );
        return;
      }

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("l", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      const scale = Math.min(
        (pageWidth - 40) / img.width,
        (pageHeight - 40) / img.height
      );
      const w = img.width * scale;
      const h = img.height * scale;
      pdf.addImage(
        img,
        "PNG",
        (pageWidth - w) / 2,
        (pageHeight - h) / 2,
        w,
        h
      );
      pdf.save(`explainify-flow-${flowVariant}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to download the flowchart right now.");
    }
  };

  return (
    <>
      <Head>
        <title>Explainify · Turning complexity into clarity</title>
        <meta
          name="description"
          content="Explainify rewrites APIs into audience-perfect documentation and podcast summaries."
        />
      </Head>
      <main className="relative min-h-screen overflow-hidden px-4 py-12 md:px-6 app-body">
        <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-2xl font-semibold">
              <span>Explainify.</span>
            </div>
            <div className="flex items-center gap-2">
              <SignedOut>
                <SignUpButton>
                  <button className="group text-[14px] px-4 py-[6px] bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl flex flex-row gap-1">
                    Register
                    <span className="-mt-[1px] transition-transform duration-200 group-hover:translate-x-[2px]">
                      →
                    </span>
                  </button>
                </SignUpButton>
                <SignInButton>
                  <button className="text-[14px] px-4 py-[6px]  text-white font-medium transition-all duration-200">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </header>
        <div className="absolute inset-0 -z-10 opacity-50 blur-3xl" />
        <div className="container space-y-12 px-0 py-12">
          <div className="grid gap-8 ">
            <section className="space-y-8 rounded-[40px] border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur-3xl md:p-8">
              <JsonInput
                value={jsonInput}
                onChange={setJsonInput}
                error={jsonError ?? undefined}
              />
              <RoleSelector
                value={selectedRole}
                onChange={setSelectedRole}
                customRole={customRole}
                onCustomRoleChange={setCustomRole}
              />
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  className="min-w-[220px]"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <Wand2 className="h-4 w-4 animate-spin" />
                      Generating tailored documentation…
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Wand2 className="h-4 w-4" />
                      Generate Documentation
                    </span>
                  )}
                </Button>
                {docs && (
                  <Button
                    variant="secondary"
                    className="gap-2 rounded-2xl border border-white/10 bg-white/10"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Regenerate
                  </Button>
                )}
              </div>
              {loading && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  <LoadingDots />
                  <span>Explainify is crafting bespoke docs…</span>
                </div>
              )}
            </section>
          </div>

          <section className="space-y-6">
            {usedMock && (
              <div className="rounded-2xl border border-dashed border-white/20 bg-black/30 px-4 py-3 text-sm text-white/60">
                {mockMessage ??
                  "Running in mock mode — add real API keys in `.env.local` to let Explainify talk to Gemini + ElevenLabs."}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              {cards.map((card, index) => (
                <ExplainCard
                  key={card.title}
                  title={card.title}
                  content={card.content}
                  rawContent={card.raw}
                  accent={cardAccents[index]}
                  onDownload={handleDownload}
                />
              ))}
            </div>

            <div className="space-y-4 rounded-[32px] border border-white/10 bg-black/40 p-6 backdrop-blur-3xl">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Choose the narration target
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variantOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setAudioVariant(option.key)}
                      className={cn(
                        "rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70 transition-all",
                        audioVariant === option.key
                          ? "bg-white/20 text-white shadow-glow"
                          : "hover:bg-white/10"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="secondary"
                  className="gap-2 rounded-2xl border border-white/10 bg-white/10"
                  onClick={handleGenerateAudio}
                  disabled={audioLoading}
                >
                  {audioLoading ? (
                    <span className="flex items-center gap-2">
                      <Radio className="h-4 w-4 animate-spin" />
                      Creating your Explainify podcast...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      🎧 Generate Audio Summary
                    </span>
                  )}
                </Button>
                <div className="flex-1" />
              </div>

              {(audioLoading || audioPath || audioMessage) && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Explainify podcast
                      </p>
                      <p className="text-sm text-white/70">
                        {audioMessage ??
                          (audioUsedMock
                            ? "Demo audio standing in until your podcast is ready."
                            : `Ready to replay the ${lastAudioLabel} storyline.`)}
                      </p>
                    </div>
                    <Visualizer active={audioLoading || isAudioPlaying} />
                  </div>
                  {audioPath && (
                    <audio
                      key={audioPath}
                      ref={audioRef}
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 p-2"
                      controls
                      src={audioPath}
                      onPlay={() => setIsAudioPlaying(true)}
                      onPause={() => setIsAudioPlaying(false)}
                      onEnded={() => setIsAudioPlaying(false)}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-[32px] border border-white/10 bg-black/40 p-6 backdrop-blur-3xl">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Flowchart focus
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variantOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setFlowVariant(option.key)}
                      className={cn(
                        "rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70 transition-all",
                        flowVariant === option.key
                          ? "bg-white/20 text-white shadow-glow"
                          : "hover:bg-white/10"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="secondary"
                  className="gap-2 rounded-2xl border border-white/10 bg-white/10"
                  onClick={handleGenerateFlow}
                  disabled={flowLoading}
                >
                  {flowLoading ? (
                    <span className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 animate-spin" />
                      Mapping your Explainify flow…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      🧭 Generate Flowchart
                    </span>
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-2xl border border-white/10 bg-white/5 text-xs text-white/80"
                    disabled={!flowchart}
                    onClick={() => handleDownloadFlowchart("png")}
                  >
                    <Download className="h-4 w-4" />
                    PNG
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-2xl border border-white/10 bg-white/5 text-xs text-white/80"
                    disabled={!flowchart}
                    onClick={() => handleDownloadFlowchart("pdf")}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
                <div className="flex-1">
                  {flowMessage && (
                    <p className="text-sm text-white/70">
                      {flowMessage}{" "}
                      {flowUsedMock && (
                        <span className="text-xs text-white/50">
                          (Demo roadmap shown)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {flowchart && (
                <div className="space-y-3">
                  <p className="text-sm text-white/80">{flowchart.summary}</p>
                  <FlowchartViewer
                    containerRef={flowchartRef}
                    data={flowchart}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-[32px] border border-white/10 bg-black/40 p-6 backdrop-blur-3xl">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Questions & Queries
                </p>
                <p className="text-sm text-white/65">
                  Ask Explainify anything about this API or flow.
                </p>
              </div>
              <textarea
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                rows={4}
                value={questionInput}
                onChange={(event) => setQuestionInput(event.target.value)}
                placeholder="e.g. What is the best way to secure the webhook callback?"
              />
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="secondary"
                  className="gap-2 rounded-2xl border border-white/10 bg-white/10"
                  onClick={handleAskQuestion}
                  disabled={questionLoading}
                >
                  {questionLoading ? (
                    <span className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 animate-spin" />
                      Thinking through an answer…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      ❓ Ask Explainify
                    </span>
                  )}
                </Button>
                {questionUsedMock && (
                  <p className="text-xs text-white/50">
                    Running in mock mode while the answerer catches up.
                  </p>
                )}
              </div>
              {questionAnswer && (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                  <p>{questionAnswer}</p>
                  {questionFollowUps.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Next questions to explore
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
                        {questionFollowUps.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Visualizer({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 items-end gap-1 text-white/60 transition-opacity",
        active ? "opacity-100" : "opacity-40"
      )}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-b from-[#7b5cff] to-[#00a1ff] animate-eq"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationPlayState: active ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}
