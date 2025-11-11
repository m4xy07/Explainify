export type AudienceRole =
  | "Student"
  | "Full Stack Developer"
  | "Security Researcher"
  | "Other";

export interface DocGenerationRequest {
  api_data: Record<string, unknown>;
  audience_focus: string;
}

export interface DocGenerationResponse {
  version_1: unknown;
  version_2: unknown;
  version_3: unknown;
  dialogue_script: unknown;
}
