import { FunctionTool, Gemini, InMemoryRunner, LlmAgent, isFinalResponse, type BaseLlm } from "@google/adk";
import { MAX_STEPS } from "../agent-config";
import { createRunContext, vertexConfig } from "./shared";
import type { RunInput } from "./types";

export async function runAdk(input: RunInput, model?: BaseLlm) {
  const config = vertexConfig();
  const ctx = createRunContext(input);
  const agent = new LlmAgent({
    name: "store_assistant", instruction: ctx.instructions,
    model: model ?? new Gemini({ model: config.model, vertexai: true, project: config.project, location: config.location }),
    tools: [
      new FunctionTool({ name: "searchDocuments", description: ctx.tools.searchDocuments.description, parameters: ctx.tools.searchDocuments.schema, execute: ctx.tools.searchDocuments.execute }),
      new FunctionTool({ name: "readDocument", description: ctx.tools.readDocument.description, parameters: ctx.tools.readDocument.schema, execute: ctx.tools.readDocument.execute }),
    ],
  });
  const runner = new InMemoryRunner({ agent, appName: "framework_lab" });
  const session = await runner.sessionService.createSession({ appName: "framework_lab", userId: "local-demo" });
  let answer = "";
  for await (const event of runner.runAsync({
    userId: "local-demo", sessionId: session.id, newMessage: { role: "user", parts: [{ text: input.question }] },
    runConfig: { maxLlmCalls: MAX_STEPS }, abortSignal: input.signal,
  })) {
    input.signal.throwIfAborted();
    if (event.errorCode) throw new Error("ADK model execution failed");
    if (isFinalResponse(event)) answer = (event.content?.parts ?? []).filter(part => !part.thought).map(part => part.text ?? "").join("");
  }
  return ctx.finish(answer);
}
