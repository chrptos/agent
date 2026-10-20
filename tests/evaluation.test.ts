import { strict as assert } from "node:assert";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { cases } from "../evals/cases";
import { evaluateCase } from "../evals/evaluate";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};
function modelFor(answer: string, readId?: string) {
  let calls = 0;
  return new MockLanguageModelV4({ doGenerate: async () => {
    calls++;
    const name = calls === 1 ? "searchDocuments" : "readDocument";
    if (calls === 1 || (calls === 2 && readId)) return {
      content: [{ type: "tool-call" as const, toolCallId: `eval-${calls}`, toolName: name, input: JSON.stringify(calls === 1 ? { query: "送料" } : { id: readId }) }],
      finishReason: { unified: "tool-calls" as const, raw: undefined }, usage, warnings: [],
    };
    return { content: [{ type: "text" as const, text: answer }], finishReason: { unified: "stop" as const, raw: undefined }, usage, warnings: [] };
  } });
}

test("正答・必要記事取得・出典を確認し、トークンを全ステップで集計する", async () => {
  const result = await evaluateCase(cases[0], modelFor("送料は500円、5,000円以上で無料です。[配送ガイド](#doc-shipping)", "shipping"));
  assert.equal(result.automaticPassed, true);
  assert.equal(result.stepCount, 3);
  assert.equal(result.usage.totalTokens, 45);
  assert.equal(result.manualReview.status, "pending");
});

test("回答が空、必要な金額が欠落、未取得記事の引用は失敗する", async () => {
  const empty = await evaluateCase(cases[0], modelFor(""));
  assert.equal(empty.automaticPassed, false);
  assert.equal(empty.checks.find(check => check.label === "空でない最終回答")?.passed, false);
  const invented = await evaluateCase(cases[0], modelFor("送料無料です。[配送ガイド](#doc-shipping)"));
  assert.equal(invented.checks.find(check => check.label === "取得した記事だけを引用")?.passed, false);
  assert.equal(invented.checks.find(check => check.label === "送料500円に言及")?.passed, false);
});

test("選択外の記事を取得しようとした場合も検出する", async () => {
  const result = await evaluateCase(cases[3], modelFor("情報がありません。", "support"));
  assert.equal(result.automaticPassed, false);
  assert.equal(result.checks.find(check => check.label === "選択外の記事を取得しようとしていない")?.passed, false);
  assert.deepEqual(result.readDocumentIds, []);
});

test("情報不足ケースは自動チェック後も人の確認を必要とする", async () => {
  const result = await evaluateCase(cases[2], modelFor("ドキュメントに情報がありません。"));
  assert.equal(result.automaticPassed, true);
  assert.equal(result.manualReview.status, "pending");
  assert.ok(result.manualReview.criteria.length > 0);
});
