import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { createVertex } from "@ai-sdk/google-vertex";
import { MAX_STEPS } from "../agent-config";
import { createRunContext, vertexConfig } from "./shared";
import type { RunInput } from "./types";

export async function runMastra(input: RunInput, model?: ReturnType<ReturnType<typeof createVertex>>) {
  const config = vertexConfig();
  const ctx = createRunContext(input);
  const agent = new Agent({
    id: "store-assistant", name: "Store assistant", instructions: ctx.instructions,
    model: model ?? createVertex({ project: config.project, location: config.location })(config.model),
    tools: {
      searchDocuments: createTool({ id: "searchDocuments", description: ctx.tools.searchDocuments.description, inputSchema: ctx.tools.searchDocuments.schema, execute: ctx.tools.searchDocuments.execute }),
      readDocument: createTool({ id: "readDocument", description: ctx.tools.readDocument.description, inputSchema: ctx.tools.readDocument.schema, execute: ctx.tools.readDocument.execute }),
    },
  });
  const result = await agent.generate(input.question, { maxSteps: MAX_STEPS, abortSignal: input.signal });
  return ctx.finish(result.text);
}
