import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, normalizeDocContent } from "@/lib/utils";

interface ExplainCardProps {
  title: string;
  content?: string;
  rawContent?: unknown;
  accent?: string;
  onDownload?: (title: string, content: string) => void;
}

export function ExplainCard({
  title,
  content,
  accent = "#7b5cff",
  rawContent,
  onDownload,
}: ExplainCardProps) {
  const body = useMemo(() => normalizeDocContent(content), [content]);
  const downloadable = useMemo(
    () => normalizeDocContent(rawContent ?? content),
    [rawContent, content]
  );

  return (
    <motion.div
      layout
      whileHover={{ translateY: -4 }}
      className="h-full"
      style={{
        filter: "drop-shadow(0px 15px 45px rgba(4, 3, 12, 0.85))",
      }}
    >
      <UiCard
        className="flex h-full flex-col border-white/15 bg-card/70 backdrop-blur-3xl"
        style={{
          boxShadow: `0 0 30px ${accent}22`,
        }}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Tailored narrative
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold"
            disabled={!downloadable}
            onClick={() => downloadable && onDownload?.(title, downloadable)}
          >
            <Download className="h-4 w-4" />
            .md
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div
            className={cn(
              "h-full max-h-[360px] overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-4 text-sm leading-relaxed text-white/80",
              !body && "text-white/40"
            )}
          >
            {body ?? "Your tailored documentation will appear here once generated."}
          </div>
        </CardContent>
      </UiCard>
    </motion.div>
  );
}
