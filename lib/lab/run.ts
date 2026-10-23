import type { FrameworkId } from "./catalog";
import type { LabRunner, RunInput } from "./types";

// Load only the selected runtime on the server.
const runners: Record<FrameworkId, () => Promise<LabRunner>> = {
  google: async () => (await import("./google")).runGoogle,
  "ai-sdk": async () => (await import("./ai-sdk")).runAiSdk,
  adk: async () => (await import("./adk")).runAdk,
  mastra: async () => (await import("./mastra")).runMastra,
  langgraph: async () => (await import("./langgraph")).runLangGraph,
  llamaindex: async () => (await import("./llamaindex")).runLlamaIndex,
  langchain: async () => (await import("./langchain")).runLangChain,
};

export async function runFramework(framework: FrameworkId, input: RunInput) {
  const start = performance.now();
  input.signal.throwIfAborted();
  const runner = await runners[framework]();
  const result = await runner(input);
  input.signal.throwIfAborted();
  return { ...result, framework, elapsedMs: Math.round(performance.now() - start) };
}
