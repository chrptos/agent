import type { ToolUIPart, DynamicToolUIPart } from "ai";
import { documents } from "../../lib/documents";
import { MAX_STEPS } from "../../lib/agent-config";

export type ApprovalHandler = (id: string, approved: boolean) => void;

type ToolCardProps = {
  part: ToolUIPart | DynamicToolUIPart;
  step: number;
  busy: boolean;
  isLatest: boolean;
  onApproval: ApprovalHandler;
};

export function ToolCard({ part, step, busy, isLatest, onApproval }: ToolCardProps) {
  const name = part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  const needsApproval = part.state === "approval-requested";
  const denied = part.state === "output-denied" ||
    (part.state === "approval-responded" && !part.approval.approved);
  const approved = part.state === "approval-responded" && part.approval.approved;
  const active = !done && !failed && !needsApproval && !denied && busy && isLatest;
  const args = part.input as { query?: string; id?: string } | undefined;
  const subject = name === "searchDocuments"
    ? args?.query
    : documents.find(document => document.id === args?.id)?.title;
  const action = name === "searchDocuments" ? "記事を検索"
    : name === "readDocument" ? "本文を確認" : name;

  if (needsApproval) {
    return (
      <div className="approval-card" role="group" aria-label="本文取得の承認">
        <span className="approval-label">実行前の確認</span>
        <p>「{subject || args?.id || "記事"}」の本文を取得しますか？</p>
        <p className="muted">承認すると、本文を取得してAIに渡し、回答を続けます。</p>
        <details>
          <summary>ツールと引数を確認</summary>
          <code>{name}</code>
          <pre>{JSON.stringify(part.input, null, 2)}</pre>
        </details>
        <div className="approval-actions">
          <button type="button" disabled={busy} onClick={() => onApproval(part.approval.id, false)}>拒否</button>
          <button type="button" className="primary" disabled={busy} onClick={() => onApproval(part.approval.id, true)}>承認して実行</button>
        </div>
      </div>
    );
  }

  const statusLabel = denied ? "・拒否済み" : active ? "中" : done ? "済み"
    : failed ? "に失敗" : approved ? "・承認済み" : "・中断";

  return (
    <details className={`inline-tool ${active ? "active" : ""}`}>
      <summary>
        <span className="tool-indicator" aria-hidden="true">{failed ? "!" : done ? "✓" : "·"}</span>
        <span>{action}{statusLabel}{subject ? `：${subject}` : ""}</span>
        <span className="tool-step">{step} / {MAX_STEPS}</span>
      </summary>
      <div className="tool-details">
        <code>{name}</code>
        <h4>引数</h4>
        <pre>{JSON.stringify(part.input ?? {}, null, 2)}</pre>
        {done && <><h4>結果</h4><pre>{JSON.stringify(part.output, null, 2)}</pre></>}
        {failed && <p role="alert">{part.errorText}</p>}
      </div>
    </details>
  );
}
