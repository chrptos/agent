import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { MAX_STEPS } from "../agent-config";
import { createRunContext, vertexConfig } from "./shared";
import type { RunInput } from "./types";

export function createGoogleClient() {
  const { project, location } = vertexConfig();
  return new GoogleGenAI({ vertexai: true, project, location });
}

// Kept separate so the direct SDK's application-owned loop can be tested.
export async function runGoogle(input: RunInput, client: { models: Pick<GoogleGenAI["models"], "generateContent"> } = createGoogleClient()) {
  const ctx = createRunContext(input);
  const contents: Content[] = [{ role: "user", parts: [{ text: input.question }] }];
  for (let step = 0; step < MAX_STEPS; step++) {
    input.signal.throwIfAborted();
    const response = await client.models.generateContent({
      model: vertexConfig().model, contents,
      config: {
        systemInstruction: ctx.instructions,
        abortSignal: input.signal,
        tools: [{ functionDeclarations: [
          { name: "searchDocuments", description: ctx.tools.searchDocuments.description, parametersJsonSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
          { name: "readDocument", description: ctx.tools.readDocument.description, parametersJsonSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
        ] }],
      },
    });
    const content = response.candidates?.[0]?.content;
    if (content) contents.push(content);
    const calls = response.functionCalls ?? [];
    if (calls.length === 0) return ctx.finish(response.text || "");
    const parts: Part[] = [];
    for (const call of calls) {
      let output: unknown;
      if (call.name === "searchDocuments") output = await ctx.tools.searchDocuments.execute(ctx.tools.searchDocuments.schema.parse(call.args));
      else if (call.name === "readDocument") output = await ctx.tools.readDocument.execute(ctx.tools.readDocument.schema.parse(call.args));
      else throw new Error("Unknown tool");
      parts.push({ functionResponse: { id: call.id, name: call.name, response: { result: output } } });
    }
    contents.push({ role: "user", parts });
  }
  return ctx.finish("");
}
