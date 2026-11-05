import type { FrameworkId } from "./catalog";

export type Trace = { name: string; input: unknown; output: unknown };
export type LabResult = {
  framework: FrameworkId;
  answer: string;
  traces: Trace[];
  sources: { id: string; title: string }[];
  elapsedMs: number;
};
export type RunInput = { question: string; documentIds: string[]; signal: AbortSignal };
export type RunOutput = Omit<LabResult, "framework" | "elapsedMs">;
export type LabRunner = (input: RunInput) => Promise<RunOutput>;
