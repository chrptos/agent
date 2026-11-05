import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { frameworks } from "../examples/shared/catalog";
import { documents } from "../lib/documents";
import { runFramework } from "../examples/shared/run";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const args = process.argv.slice(2);
const selected = args.filter(arg => arg !== "--live");
if (selected.some(id => !frameworks.some(item => item.id === id))) throw new Error("Unknown framework id");
const targets = frameworks.filter(item => selected.length === 0 || selected.includes(item.id));
if (!args.includes("--live")) {
  console.log("対象: " + targets.map(item => item.id).join(", "));
  console.log("実行: npm run lab:smoke -- --live [framework-id ...]（Vertex AIの利用料金が発生）");
} else {
  const results = [];
  for (const target of targets) {
    try {
      const result = await runFramework(target.id, {
        question: "送料はいくらですか？", documentIds: documents.map(doc => doc.id), signal: AbortSignal.timeout(55_000),
      });
      const pass = /500/.test(result.answer) && result.sources.some(source => source.id === "shipping");
      results.push({ ...result, pass });
      console.log(`${target.id}: ${pass ? "PASS" : "FAIL"} (${result.elapsedMs}ms)`);
    } catch (error) {
      // Public reports must not contain credentials, resource URLs or project IDs.
      const name = error instanceof Error ? error.name : "UnknownError";
      results.push({ framework: target.id, pass: false, error: name });
      console.log(`${target.id}: FAIL (${name})`);
    }
  }
  await mkdir("eval-results", { recursive: true });
  const path = `eval-results/lab-smoke-${Date.now()}.json`;
  await writeFile(path, JSON.stringify({ question: "送料はいくらですか？", results }, null, 2));
  console.log(`結果: ${path}`);
  if (results.some(result => !result.pass)) process.exitCode = 1;
}
