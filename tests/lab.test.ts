import { strict as assert } from "node:assert";
import { test } from "node:test";
import { GenerateContentResponse, type GenerateContentParameters } from "@google/genai";
import { MockLanguageModelV4 } from "ai/test";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { FakeStreamingChatModel } from "@langchain/core/utils/testing";
import { BaseLlm, type LlmRequest, type LlmResponse } from "@google/adk";
import { createRunContext } from "../examples/shared/context";
import { labRequestSchema } from "../examples/shared/request";
import { runGoogle } from "../examples/google-genai/run";
import { runAiSdk } from "../examples/ai-sdk/run";
import { runAdk } from "../examples/adk/run";
import { runMastra } from "../examples/mastra/run";
import { runLangChain } from "../examples/langchain/run";
import { runLangGraph } from "../examples/langgraph/run";
import { runLlamaIndex } from "../examples/llamaindex/run";
import type { RunInput } from "../examples/shared/types";
import { POST } from "../app/api/lab/route";

process.env.GOOGLE_VERTEX_PROJECT = "test-project";
const input = (): RunInput => ({ question: "送料はいくら？", documentIds: ["shipping"], signal: new AbortController().signal });
const answer = "送料は500円です。[配送ガイド](#doc-shipping)";
const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 10, text: 10, reasoning: 0 } };

test("比較APIの入力は未知の実装・記事・空質問・長い質問を拒否する", () => {
  const base = { framework: "google", question: "送料", documentIds: ["shipping"] };
  assert.equal(labRequestSchema.safeParse(base).success, true);
  for (const extra of [{ framework: "constructor" }, { documentIds: ["../../.env.local"] }, { documentIds: [] }, { question: " " }, { question: "a".repeat(2001) }]) {
    assert.equal(labRequestSchema.safeParse({ ...base, ...extra }).success, false);
  }
});

test("比較APIは不正JSONと大きすぎる入力を400、未設定を503にする", async () => {
  for (const body of ["{", JSON.stringify({ framework: "google", question: "a".repeat(10_001), documentIds: ["shipping"] })]) {
    const response = await POST(new Request("http://localhost/api/lab", { method: "POST", body }));
    assert.equal(response.status, 400);
  }
  const previous = process.env.GOOGLE_VERTEX_PROJECT;
  delete process.env.GOOGLE_VERTEX_PROJECT;
  try {
    const response = await POST(new Request("http://localhost/api/lab", { method: "POST", body: JSON.stringify({ framework: "google", question: "送料", documentIds: ["shipping"] }) }));
    assert.equal(response.status, 503);
  } finally { process.env.GOOGLE_VERTEX_PROJECT = previous; }
});

test("参照範囲を検索・本文取得の両方で守り、取得した本文だけを出典に記録する", async () => {
  const ctx = createRunContext({ ...input(), documentIds: ["support"] });
  assert.deepEqual(await ctx.tools.searchDocuments.execute({ query: "送料" }), { documents: [] });
  assert.equal((await ctx.tools.readDocument.execute({ id: "shipping" })).found, false);
  assert.deepEqual(ctx.finish(answer).sources, []);
  assert.doesNotMatch(JSON.stringify(ctx.traces), /通常配送/);
  await ctx.tools.readDocument.execute({ id: "support" });
  assert.deepEqual(ctx.finish(answer).sources.map(source => source.id), ["support"]);
});

test("中断された実行は追加のツール処理を停止する", async () => {
  const controller = new AbortController();
  const ctx = createRunContext({ ...input(), signal: controller.signal });
  controller.abort();
  await assert.rejects(() => ctx.tools.readDocument.execute({ id: "shipping" }), { name: "AbortError" });
  assert.equal(ctx.traces.length, 0);
});

test("Google SDKの手動ループが関数の結果を次の呼び出しに渡す", async () => {
  let calls = 0;
  const result = await runGoogle(input(), { models: { generateContent: async (params: GenerateContentParameters) => {
    calls++;
    if (calls === 3) assert.match(JSON.stringify(params.contents), /通常配送は注文確定/);
    const response = new GenerateContentResponse();
    response.candidates = [{ content: { role: "model", parts: calls === 1
      ? [{ functionCall: { name: "searchDocuments", args: { query: "送料" } } }]
      : calls === 2 ? [{ functionCall: { name: "readDocument", args: { id: "shipping" } } }] : [{ text: answer }] } }];
    return response;
  } } });
  assert.equal(calls, 3);
  assert.equal(result.answer, answer);
  assert.deepEqual(result.traces.map(trace => trace.name), ["searchDocuments", "readDocument"]);
});

test("Google SDKのループはツール要求が続いても6回で止まる", async () => {
  let calls = 0;
  const result = await runGoogle(input(), { models: { generateContent: async () => {
    calls++;
    const response = new GenerateContentResponse();
    response.candidates = [{ content: { role: "model", parts: [{ functionCall: { name: "searchDocuments", args: { query: "送料" } } }] } }];
    return response;
  } } });
  assert.equal(calls, 6);
  assert.match(result.answer, /回答を生成せず/);
});

test("AI SDK版がネイティブのツールループを実行する", async () => {
  let calls = 0;
  const model = new MockLanguageModelV4({ doGenerate: async ({ prompt }) => {
    calls++;
    if (calls === 2) {
      assert.match(JSON.stringify(prompt), /500円/);
      return { content: [{ type: "text", text: answer }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
    }
    return { content: [{ type: "tool-call", toolCallId: "read", toolName: "readDocument", input: '{"id":"shipping"}' }], finishReason: { unified: "tool-calls", raw: undefined }, usage, warnings: [] };
  } });
  const result = await runAiSdk(input(), model);
  assert.equal(result.answer, answer);
  assert.equal(result.sources[0]?.id, "shipping");
});

class ScriptedAdkModel extends BaseLlm {
  calls = 0;
  constructor() { super({ model: "test-model" }); }
  async *generateContentAsync(request: LlmRequest): AsyncGenerator<LlmResponse> {
    this.calls++;
    if (this.calls === 2) assert.match(JSON.stringify(request.contents), /500円/);
    yield { content: { role: "model", parts: this.calls === 1 ? [{ functionCall: { id: "adk-read", name: "readDocument", args: { id: "shipping" } } }] : [{ text: answer }] } };
  }
  async connect(): Promise<never> { throw new Error("Not a live model"); }
}

test("ADK版のRunnerがFunctionToolを実行し結果をモデルに戻す", async () => {
  const model = new ScriptedAdkModel();
  const result = await runAdk(input(), model);
  assert.equal(model.calls, 2);
  assert.equal(result.answer, answer);
  assert.equal(result.sources[0]?.id, "shipping");
});

test("Mastra版がcreateToolを実行して回答を返す", async () => {
  let calls = 0;
  const model = new MockLanguageModelV4({ doGenerate: async ({ prompt }) => {
    calls++;
    if (calls === 2) {
      assert.match(JSON.stringify(prompt), /500円/);
      return { content: [{ type: "text", text: answer }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
    }
    return { content: [{ type: "tool-call", toolCallId: "mastra-read", toolName: "readDocument", input: '{"id":"shipping"}' }], finishReason: { unified: "tool-calls", raw: undefined }, usage, warnings: [] };
  } });
  const result = await runMastra(input(), model);
  assert.equal(result.answer, answer);
  assert.equal(result.sources[0]?.id, "shipping");
});

class ScriptedChatModel extends FakeStreamingChatModel {
  calls = 0;
  constructor() { super({}); }
  bindTools() { return this; }
  async _generate(messages: BaseMessage[]) {
    this.calls++;
    if (this.calls === 2) assert.match(JSON.stringify(messages), /500円/);
    const message = this.calls === 1
      ? new AIMessage({ content: "", tool_calls: [{ id: "lc-read", name: "readDocument", args: { id: "shipping" }, type: "tool_call" }] })
      : new AIMessage(answer);
    return { generations: [{ text: message.text, message }] };
  }
}

for (const [name, run] of [["LangChain", runLangChain], ["LangGraph", runLangGraph]] as const) {
  test(`${name}版が実際のランタイムでモデル→ツール→回答を実行する`, async () => {
    const model = new ScriptedChatModel();
    const result = await run(input(), model);
    assert.equal(result.answer, answer);
    assert.equal(result.sources[0]?.id, "shipping");
    assert.equal(model.calls, 2);
  });
}

test("LlamaIndex版は選択記事だけを索引化し、検索本文を回答生成へ渡す", async () => {
  const embedded: string[] = [];
  const result = await runLlamaIndex(input(), { models: {
    embedContent: async params => {
      const text = JSON.stringify(params.contents);
      embedded.push(text);
      assert.doesNotMatch(text, /サポートは平日|未使用の商品/);
      return { embeddings: [{ values: [1, 0, 0] }] };
    },
    generateContent: async params => {
      assert.match(JSON.stringify(params.contents), /500円/);
      const response = new GenerateContentResponse();
      response.candidates = [{ content: { parts: [{ text: answer }] } }];
      return response;
    },
  } });
  assert.ok(embedded.length >= 2);
  assert.equal(result.answer, answer);
  assert.deepEqual(result.sources.map(source => source.id), ["shipping"]);
  assert.deepEqual(result.traces.map(trace => trace.name), ["splitDocuments", "buildVectorIndex", "retrieve"]);
});
