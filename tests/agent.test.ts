import { strict as assert } from "node:assert";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModel } from "ai";
import { createDocumentAgent as createAgent, MAX_STEPS } from "../lib/agent";

const createDocumentAgent = (model?: LanguageModel, ids?: string[]) => createAgent(model, ids, { requireReadApproval: false });

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 10, text: 10, reasoning: 0 },
};

test("検索と本文取得の結果が次のモデル呼び出しへ渡り、回答で終了する", async () => {
  let calls = 0;
  const model = new MockLanguageModelV4({
    doGenerate: async ({ prompt }) => {
      calls++;
      if (calls === 3) {
        assert.match(JSON.stringify(prompt), /通常配送は注文確定から3営業日以内/);
        return { content: [{ type: "text", text: "送料は500円です。[配送ガイド](#doc-shipping)" }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
      }
      if (calls === 2) assert.match(JSON.stringify(prompt), /shipping/);
      return {
        content: [{ type: "tool-call", toolCallId: `call-${calls}`, toolName: calls === 1 ? "searchDocuments" : "readDocument", input: JSON.stringify(calls === 1 ? { query: "送料" } : { id: "shipping" }) }],
        finishReason: { unified: "tool-calls", raw: undefined }, usage, warnings: [],
      };
    },
  });
  const result = await createDocumentAgent(model).generate({ prompt: "送料はいくら？" });
  assert.equal(calls, 3);
  assert.equal(result.steps.length, 3);
  assert.match(result.text, /500円/);
});

test("ツール呼び出しが続いても最大ステップ数で停止する", async () => {
  let calls = 0;
  const model = new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "tool-call", toolCallId: `call-${++calls}`, toolName: "searchDocuments", input: JSON.stringify({ query: "海外配送" }) }],
      finishReason: { unified: "tool-calls", raw: undefined }, usage, warnings: [],
    }),
  });
  const result = await createDocumentAgent(model).generate({ prompt: "海外配送はできますか？" });
  assert.equal(calls, MAX_STEPS);
  assert.equal(result.steps.length, MAX_STEPS);
  assert.equal(result.text, "");
});

test("選択外の記事は検索結果にも本文取得にも含めない", async () => {
  let calls = 0;
  const model = new MockLanguageModelV4({
    doGenerate: async ({ prompt }) => {
      calls++;
      if (calls === 2) {
        const result = prompt.filter(message => message.role === "tool");
        assert.doesNotMatch(JSON.stringify(result), /shipping/);
      }
      if (calls === 3) {
        const result = prompt.filter(message => message.role === "tool");
        assert.match(JSON.stringify(result), /参照対象に選択されていません/);
        assert.doesNotMatch(JSON.stringify(result), /通常配送は注文確定/);
        return { content: [{ type: "text", text: "選択した記事には情報がありません。" }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
      }
      return {
        content: [{ type: "tool-call", toolCallId: `scope-${calls}`, toolName: calls === 1 ? "searchDocuments" : "readDocument", input: JSON.stringify(calls === 1 ? { query: "送料" } : { id: "shipping" }) }],
        finishReason: { unified: "tool-calls", raw: undefined }, usage, warnings: [],
      };
    },
  });
  await createDocumentAgent(model, ["returns"]).generate({ prompt: "送料は？" });
  assert.equal(calls, 3);
});
