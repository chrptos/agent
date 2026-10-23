import type { LanguageModel } from "ai";
import { createDocumentAgent, MAX_STEPS } from "../lib/agent";
import type { EvalCase } from "./cases";

type AgentResult = Awaited<ReturnType<ReturnType<typeof createDocumentAgent>["generate"]>>;
export type Check = { label: string; passed: boolean };

export function assess(testCase: EvalCase, result: AgentResult) {
  const calls = result.steps.flatMap(step => step.toolCalls);
  const successfulReads = result.steps.flatMap(step => step.toolResults).filter(
    result => result.toolName === "readDocument" && typeof result.output === "object" && result.output !== null && "found" in result.output && result.output.found === true,
  ).map(result => (result.input as { id: string }).id);
  const selected = new Set(testCase.documentIds);
  const citations = [...result.text.matchAll(/\]\(#doc-([^\s)]+)\)/g)].map(match => match[1]);
  const checks: Check[] = [
    { label: "空でない最終回答", passed: result.text.trim().length > 0 },
    { label: "ステップ上限内", passed: result.steps.length <= MAX_STEPS },
    { label: "検索ツールを利用", passed: calls.some(call => call.toolName === "searchDocuments") },
    { label: "選択外の記事を取得しようとしていない", passed: calls.every(call => call.toolName !== "readDocument" || selected.has((call.input as { id: string }).id)) },
    { label: "取得した記事だけを引用", passed: citations.every(id => selected.has(id) && successfulReads.includes(id)) },
    { label: "ツール実行エラーなし", passed: result.steps.every(step => !step.content.some(part => part.type === "tool-error")) },
    ...testCase.requiredReads.map(id => ({ label: `必要な記事を取得: ${id}`, passed: successfulReads.includes(id) })),
    ...testCase.checks.map(check => ({ label: check.label, passed: check.pattern.test(result.text.normalize("NFKC")) })),
  ];
  return {
    automaticPassed: checks.every(check => check.passed), checks,
    answer: result.text, stepCount: result.steps.length,
    toolCalls: calls.map(call => ({ name: call.toolName, input: call.input })),
    readDocumentIds: successfulReads,
    usage: { inputTokens: result.totalUsage.inputTokens ?? null, outputTokens: result.totalUsage.outputTokens ?? null, totalTokens: result.totalUsage.totalTokens ?? null },
    manualReview: { status: "pending", criteria: testCase.review },
  };
}

export async function evaluateCase(testCase: EvalCase, model?: LanguageModel) {
  const started = performance.now();
  // Batch evaluations explicitly exercise retrieval without an interactive approval UI.
  const result = await createDocumentAgent(model, testCase.documentIds, { requireReadApproval: false }).generate({
    prompt: testCase.question, abortSignal: AbortSignal.timeout(55_000),
  });
  return { caseId: testCase.id, question: testCase.question, documentIds: testCase.documentIds, elapsedMs: Math.round(performance.now() - started), ...assess(testCase, result) };
}
