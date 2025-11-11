"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";

import { cn, formatBytes } from "@/lib/utils";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function JsonInput({ value, onChange, error }: JsonInputProps) {
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number }>();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          onChange(text);
          setFileMeta({ name: file.name, size: file.size });
        })
        .catch(() => {
          setFileMeta(undefined);
        });
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    onDrop,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps({
          className: cn(
            "rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl transition-all",
            isDragActive && "border-[#7b5cff] shadow-glow"
          ),
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                Input Your API Specification
              </p>
              <p className="text-sm text-white/65">
                Paste raw JSON, or drop an OpenAPI file below.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
              <Upload className="h-3.5 w-3.5" />
              JSON / .spec
            </span>
          </div>
          <div className="rounded-2xl border border-white/10">
            <CodeMirror
              value={value}
              height="320px"
              theme={oneDark}
              basicSetup={{
                highlightActiveLine: false,
                lineNumbers: true,
                foldGutter: true,
              }}
              extensions={[json()]}
              onChange={(editorValue) => onChange(editorValue)}
              className="text-sm"
            />
          </div>
          <p className="text-xs text-white/50">
            Supports OpenAPI-style JSON or custom API schema.
          </p>
        </div>
      </div>
      {fileMeta && (
        <p className="text-xs text-green-300/80">
          Loaded <span className="font-semibold">{fileMeta.name}</span> (
          {formatBytes(fileMeta.size)}).
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
