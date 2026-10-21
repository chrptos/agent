import { strict as assert } from "node:assert";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { createDocumentAgent } from "../lib/agent";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

for (const approved of [true, false]) {
  test(approved ? "承認前には本文を取得せず、承認後に取得して再開する" : "拒否した場合は本文を取得せず、拒否結果を渡して再開する", async () => {
    let calls = 0;
    const model = new MockLanguageModelV4({ doGenerate: async ({ prompt }) => {
      calls++;
      if (calls === 1) return {
        content: [{ type: "tool-call", toolCallId: "read-shipping", toolName: "readDocument", input: JSON.stringify({ id: "shipping" }) }],
        finishReason: { unified: "tool-calls", raw: undefined }, usage, warnings: [],
      };
      const history = JSON.stringify(prompt.filter(message => message.role === "tool"));
      if (approved) assert.match(history, /通常配送は注文確定/);
      else {
        assert.doesNotMatch(history, /通常配送は注文確定/);
        assert.match(history, /denied|拒否/i);
      }
      return { content: [{ type: "text", text: approved ? "送料は500円です。" : "本文取得が拒否されたため確認できません。" }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
    } });
    const agent = createDocumentAgent(model, ["shipping"]);
    const first = await agent.generate({ prompt: "送料は？" });
    assert.equal(calls, 1);
    assert.equal(first.steps.flatMap(step => step.toolResults).length, 0);
    assert.doesNotMatch(JSON.stringify(first.response.messages), /通常配送は注文確定/);
    const approval = first.content.find(part => part.type === "tool-approval-request");
    assert.ok(approval && approval.type === "tool-approval-request");
    const resumed = await agent.generate({ messages: [
      { role: "user", content: "送料は？" },
      ...first.response.messages,
      { role: "tool", content: [{ type: "tool-approval-response", approvalId: approval.approvalId, approved }] },
    ] });
    assert.equal(calls, 2);
    assert.match(resumed.text, approved ? /500円/ : /拒否/);
  });
}
