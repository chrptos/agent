import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { messagesStateReducer } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { MAX_STEPS } from "../agent-config";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createLangChainContext } from "./langchain-shared";
import type { RunInput } from "./types";

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer, default: () => [] }),
  calls: Annotation<number>({ reducer: (previous, next) => previous + next, default: () => 0 }),
});

export async function runLangGraph(input: RunInput, injectedModel?: BaseChatModel) {
  const ctx = createLangChainContext(input, injectedModel);
  if (!ctx.model.bindTools) throw new Error("Model does not support tools");
  const model = ctx.model.bindTools(ctx.langChainTools);
  const graph = new StateGraph(State)
    .addNode("model", async state => {
      input.signal.throwIfAborted();
      ctx.record("modelNode", { step: state.calls + 1 }, { next: "モデルが回答またはツールを選択" });
      const response = await model.invoke([new SystemMessage(ctx.instructions), ...state.messages], { signal: input.signal });
      return { messages: [response], calls: 1 };
    })
    .addNode("tools", async state => {
      const last = state.messages.at(-1);
      if (!AIMessage.isInstance(last)) return { messages: [] };
      const messages: ToolMessage[] = [];
      for (const call of last.tool_calls ?? []) {
        if (!call.id) throw new Error("Invalid tool call");
        let output: unknown;
        if (call.name === "searchDocuments") output = await ctx.tools.searchDocuments.execute(ctx.tools.searchDocuments.schema.parse(call.args));
        else if (call.name === "readDocument") output = await ctx.tools.readDocument.execute(ctx.tools.readDocument.schema.parse(call.args));
        else throw new Error("Unknown tool");
        messages.push(new ToolMessage({ content: JSON.stringify(output), tool_call_id: call.id, name: call.name }));
      }
      return { messages };
    })
    .addEdge(START, "model")
    .addConditionalEdges("model", state => {
      const last = state.messages.at(-1);
      return AIMessage.isInstance(last) && last.tool_calls?.length && state.calls < MAX_STEPS ? "tools" : END;
    })
    .addEdge("tools", "model")
    .compile();
  const result = await graph.invoke({ messages: [new HumanMessage(input.question)] }, { signal: input.signal, recursionLimit: MAX_STEPS * 2 + 1 });
  const last = result.messages.at(-1);
  return ctx.finish(AIMessage.isInstance(last) && !last.tool_calls?.length ? last.text : "");
}
