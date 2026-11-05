import type { FrameworkId } from "./catalog";
import type { LabRunner, RunInput } from "./types";

// Load only the selected runtime on the server.
const runners: Record<FrameworkId, () => Promise<LabRunner>> = {
  google: async () => (await import("../google-genai/run")).runGoogle,
  "ai-sdk": async () => (await import("../ai-sdk/run")).runAiSdk,
  adk: async () => (await import("../adk/run")).runAdk,
  mastra: async () => (await import("../mastra/run")).runMastra,
  langgraph: async () => (await import("../langgraph/run")).runLangGraph,
  llamaindex: async () => (await import("../llamaindex/run")).runLlamaIndex,
  langchain: async () => (await import("../langchain/run")).runLangChain,
};

export async function runFramework(framework: FrameworkId, input: RunInput) {
  const start = performance.now();
  input.signal.throwIfAborted();
  const runner = await runners[framework]();
  const result = await runner(input);
  input.signal.throwIfAborted();
  return { ...result, framework, elapsedMs: Math.round(performance.now() - start) };
}
