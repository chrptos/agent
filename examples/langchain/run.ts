import { createAgent } from "langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MAX_STEPS } from "../../lib/agent-config";
import { createLangChainContext } from "../shared/langchain";
import type { RunInput } from "../shared/types";

export async function runLangChain(input: RunInput, model?: BaseChatModel) {
  const ctx = createLangChainContext(input, model);
  const agent = createAgent({ model: ctx.model, tools: ctx.langChainTools, systemPrompt: ctx.instructions });
  const result = await agent.invoke({ messages: [new HumanMessage(input.question)] }, {
    signal: input.signal, recursionLimit: MAX_STEPS * 2 + 1,
  });
  const last = result.messages.at(-1);
  return ctx.finish(AIMessage.isInstance(last) && !last.tool_calls?.length ? last.text : "");
}
