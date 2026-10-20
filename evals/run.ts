import { mkdir, writeFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { execFileSync } from "node:child_process";
import { cases } from "./cases";
import { evaluateCase } from "./evaluate";

const args = process.argv.slice(2);
if (args.some(arg => arg !== "--live")) {
  console.error("使用方法: npm run eval -- --live");
  process.exit(1);
}
if (!args.includes("--live")) {
  console.log("固定ケース: " + cases.map(testCase => testCase.id).join(", "));
  console.log("実モデルの評価: npm run eval -- --live（Vertex AIの利用料金が発生します）");
  process.exit(0);
}
try { loadEnvFile(".env.local"); } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    console.error(".env.localを読み込めません。設定を確認してください。");
    process.exit(1);
  }
}
if (!process.env.GOOGLE_VERTEX_PROJECT) {
  console.error("GOOGLE_VERTEX_PROJECTを.env.localまたは環境変数で設定してください。");
  process.exit(1);
}
const startedAt = new Date().toISOString();
const runs = [];
for (const testCase of cases) {
  try {
    const result = await evaluateCase(testCase);
    runs.push(result);
    console.log(`${result.automaticPassed ? "PASS" : "FAIL"} ${testCase.id}: ${result.stepCount} steps / ${result.elapsedMs}ms / ${result.usage.totalTokens ?? "unknown"} tokens`);
    for (const check of result.checks.filter(check => !check.passed)) console.log(`  - ${check.label}`);
  } catch {
    // Do not print provider exceptions: they may contain credential or project details.
    runs.push({ caseId: testCase.id, automaticPassed: false, error: "実行失敗。認証・権限・モデル・クォータ・タイムアウトを確認してください。", manualReview: { status: "pending", criteria: testCase.review } });
    console.error(`ERROR ${testCase.id}: 実行失敗。以降のケースは実行しません。`);
    break;
  }
}
let revision = "unknown";
try { revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* Git metadata is optional. */ }
const report = {
  schemaVersion: 1, suite: "documents-v1", startedAt, finishedAt: new Date().toISOString(), revision,
  model: process.env.GOOGLE_VERTEX_MODEL || "gemini-2.5-flash",
  location: process.env.GOOGLE_VERTEX_LOCATION || "global",
  plannedCases: cases.length, completedCases: runs.length,
  automaticPassed: runs.length === cases.length && runs.every(run => run.automaticPassed),
  manualReviewStatus: "pending", runs,
};
await mkdir("eval-results", { recursive: true });
const path = `eval-results/${startedAt.replace(/[:.]/g, "-")}.json`;
await writeFile(path, JSON.stringify(report, null, 2) + "\n");
console.log(`結果: ${path}\n自動判定は簡易チェックです。JSON内の回答とmanualReview.criteriaを確認してください。`);
if (!report.automaticPassed) process.exitCode = 1;
