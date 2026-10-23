import { createVertex } from "@ai-sdk/google-vertex";
import { ToolLoopAgent, stepCountIs, tool, type LanguageModel } from "ai";
import { MAX_STEPS } from "../agent-config";
import { createRunContext, vertexConfig } from "./shared";
import type { RunInput } from "./types";

export async function runAiSdk(input: RunInput, model?: LanguageModel) {
  const config = vertexConfig();
  const ctx = createRunContext(input);
  const agent = new ToolLoopAgent({
    model: model ?? createVertex({ project: config.project, location: config.location })(config.model),
    instructions: ctx.instructions,
    tools: {
      searchDocuments: tool({ description: ctx.tools.searchDocuments.description, inputSchema: ctx.tools.searchDocuments.schema, execute: ctx.tools.searchDocuments.execute }),
      readDocument: tool({ description: ctx.tools.readDocument.description, inputSchema: ctx.tools.readDocument.schema, execute: ctx.tools.readDocument.execute }),
    },
    stopWhen: stepCountIs(MAX_STEPS),
  });
  const result = await agent.generate({ prompt: input.question, abortSignal: input.signal });
  return ctx.finish(result.text);
}
