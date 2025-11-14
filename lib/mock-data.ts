export const mockApiSpec = {
  info: {
    title: "Explainify Tasks API",
    description: "Track, assign, and review Explainify documentation tasks.",
    version: "1.0.0",
  },
  servers: [{ url: "https://api.explainify.dev/v1" }],
  paths: {
    "/tasks": {
      get: {
        summary: "List tasks",
        responses: {
          "200": {
            description: "Collection of tasks",
          },
        },
      },
      post: {
        summary: "Create a task",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  title: { type: "string" },
                  role: { type: "string" },
                  specUrl: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
};

import type { DocGenerationResponse } from "@/types/generation";

export const mockDocResponse: DocGenerationResponse = {
  version_1:
    "### TL;DR\nExplainify Tasks collects project briefs, audiences, and statuses so the AI writer can plan better. Submit JSON payloads to `/tasks` with a `title`, `role`, and optional `specUrl`. Fetch everything with a GET to `/tasks`.\n\n### Why it matters\nStudents and new teammates see only the fields they need. Everything stays normalized, so the Explainify agent can summarize quickly.",
  version_2:
    "### Endpoints\n- `GET /tasks`\n  - Optional filters: `role`, `status`, `tag` as query params\n  - Returns paginated `{ items: Task[], cursor: string | null }`\n- `POST /tasks`\n  - Body schema: `{ title: string; audience: string; specUrl?: string; status?: 'draft' | 'ready' }`\n  - Idempotency supported through `Idempotency-Key` header\n\n### Auth & headers\nProvide `Authorization: Bearer <token>`. Rate limit is 60 req/min/IP.\n\n### Webhooks\nConfigure webhook targets under `/settings/webhooks` to be notified whenever `status` flips to `ready`.",
  version_3:
    "### Security Researcher focus\n- **Surface area:** Only two public endpoints; both expect HTTPS + JWT.\n- **Input validation:** `title` truncated to 140 chars server-side. `specUrl` validated against RFC 3986 but not fetched automatically.\n- **Threat model tips:** Create a dedicated service account token and rotate monthly. Use `scope=tasks.write` when POSTing and keep GET tokens read-only. Webhook signatures rely on `Explainify-Signature` (HMAC-SHA256).",
  dialogue_script:
    "Monika: I'm trying to grasp what the Explainify Tasks API actually does.\nVikram: Think of it as an intake form for API briefs—POST creates a work item and GET lets you check everything.\nMonika: So it's minimal on purpose?\nVikram: Exactly. Only the metadata Explainify needs, plus JWT + rate limits to keep it safe.\nMonika: Got it, thanks!",
};
