import { createVertex } from "@ai-sdk/google-vertex";
import { ToolLoopAgent, stepCountIs, type LanguageModel } from "ai";
import { documents } from "./documents";
import { createInstructions, MAX_STEPS } from "./agent-config";
import { createDocumentTools } from "./document-tools";

export { MAX_STEPS } from "./agent-config";

type AgentOptions = { requireReadApproval?: boolean };

export function createDocumentAgent(
  model?: LanguageModel,
  documentIds: string[] = documents.map(document => document.id),
  { requireReadApproval = true }: AgentOptions = {},
) {
  const vertex = createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: process.env.GOOGLE_VERTEX_LOCATION || "global",
  });

  return new ToolLoopAgent({
    model: model ?? vertex(process.env.GOOGLE_VERTEX_MODEL || "gemini-2.5-flash"),
    instructions: createInstructions(documentIds),
    stopWhen: stepCountIs(MAX_STEPS),
    tools: createDocumentTools(documentIds, requireReadApproval),
  });
}
