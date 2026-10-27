import { ChatVertexAI } from "@langchain/google-vertexai";
import { tool } from "@langchain/core/tools";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createRunContext, vertexConfig } from "./context";
import type { RunInput } from "./types";

export function createLangChainContext(input: RunInput, injectedModel?: BaseChatModel) {
  const config = vertexConfig();
  const ctx = createRunContext(input);
  const model = injectedModel ?? new ChatVertexAI({ model: config.model, location: config.location, authOptions: { projectId: config.project }, maxRetries: 0 });
  const tools = [
    tool(ctx.tools.searchDocuments.execute, { name: "searchDocuments", description: ctx.tools.searchDocuments.description, schema: ctx.tools.searchDocuments.schema }),
    tool(ctx.tools.readDocument.execute, { name: "readDocument", description: ctx.tools.readDocument.description, schema: ctx.tools.readDocument.schema }),
  ];
  return { ...ctx, model, langChainTools: tools };
}
