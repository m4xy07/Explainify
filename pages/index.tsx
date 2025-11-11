import Head from "next/head";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Radio, RefreshCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { ExplainCard } from "@/components/Card";
import { JsonInput } from "@/components/JsonInput";
import { LoadingDots } from "@/components/LoadingDots";
import { RoleSelector } from "@/components/RoleSelector";
import { Button } from "@/components/ui/button";
import { mockApiSpec, mockDocResponse } from "@/lib/mock-data";
import { cn, normalizeDocContent, stripFields } from "@/lib/utils";
import type { AudienceRole, DocGenerationResponse } from "@/types/generation";

const cardAccents = ["#7b5cff", "#ff4d67", "#00a1ff"];

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
  const [audioVariant, setAudioVariant] = useState<
    "version_1" | "version_2" | "version_3"
  >("version_1");
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [audioUsedMock, setAudioUsedMock] = useState(false);
  const [lastAudioLabel, setLastAudioLabel] = useState("Beginner");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudience =
    selectedRole === "Other" ? customRole.trim() : selectedRole;

  const cards = useMemo(() => {
    const payload = docs ?? mockDocResponse;
    const hiddenFields = ["title", "audience", "audience_level"];
    return [
      {
        key: "version_1" as const,
        title: "Beginner",
        content: stripFields(normalizeDocContent(payload.version_1), hiddenFields),
        raw: payload.version_1,
      },
      {
        key: "version_2" as const,
        title: "Developer",
        content: stripFields(normalizeDocContent(payload.version_2), hiddenFields),
        raw: payload.version_2,
      },
      {
        key: "version_3" as const,
        title: activeAudience || "Role Focused",
        content: stripFields(normalizeDocContent(payload.version_3), hiddenFields),
        raw: payload.version_3,
      },
    ];
  }, [docs, activeAudience]);

  const audioVariants = useMemo(
    () => [
      { key: "version_1" as const, label: "Beginner" },
      { key: "version_2" as const, label: "Developer" },
      {
        key: "version_3" as const,
        label: activeAudience || "Role Focused",
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

  const handleDownload = (title: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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

    const variantMeta = audioVariants.find(
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

  return (
    <>
      <Head>
        <title>Explainify · Turning complexity into clarity</title>
        <meta
          name="description"
          content="Explainify rewrites APIs into audience-perfect documentation and podcast summaries."
        />
      </Head>
      <main className="relative min-h-screen overflow-hidden px-4 py-12 md:px-6">
        <div className="absolute inset-0 -z-10 opacity-50 blur-3xl" />
        <div className="container space-y-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
            Turning complexity into clarity
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Explainify
            </h1>
            <p className="mt-4 text-lg text-white/70 md:text-xl">
              Paste your schema, pick a persona, and learn like never before in
              seconds.
            </p>
          </motion.section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
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

            <aside className="rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-3xl md:p-8">
              <h3 className="text-lg font-semibold text-white">
                Explainify playbook
              </h3>
              <ul className="mt-4 space-y-4 text-sm text-white/70">
                <li>① Validate that your JSON is well-formed.</li>
                <li>② Pick the persona who needs the story.</li>
                <li>③ Personalized docs + dialogue podcast appear below.</li>
                <li>
                  ④ Spin up an audio summary for commute-friendly playback.
                </li>
              </ul>
              {/* <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-5 text-sm text-white/60">
                <p className="font-semibold text-white">Static demo mode</p>
                <p>
                  Without API keys, Explainify shows off using curated mock
                  specs so you can perfect the flow before wiring real
                  providers.
                </p>
              </div> */}
            </aside>
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
                  {audioVariants.map((option) => (
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
