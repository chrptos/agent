"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useState } from "react";
import { documents } from "../lib/documents";
import { MAX_STEPS } from "../lib/agent-config";
import { ChatMessages } from "./components/chat-messages";
import { SourcePicker } from "./components/source-picker";

const examples = [
  "送料はいくらですか？",
  "返品の条件と申請方法を教えて",
  "海外配送はできますか？",
];

export default function Page() {
  const [input, setInput] = useState("");
  const [documentIds, setDocumentIds] = useState(documents.map(document => document.id));
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const {
    messages, sendMessage, status, error, stop,
    setMessages, clearError, addToolApprovalResponse,
  } = useChat({
    transport: new DefaultChatTransport({ body: { documentIds } }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const lastMessage = messages.at(-1);
  const busy = status === "submitted" || status === "streaming";
  const awaitingApproval = lastMessage?.parts.some(
    part => isToolUIPart(part) && part.state === "approval-requested",
  ) ?? false;
  const selectionLocked = busy || messages.length > 0;
  const inputDisabled = busy || awaitingApproval;
  const endedWithoutAnswer = !busy && !awaitingApproval &&
    lastMessage?.role === "assistant" &&
    !lastMessage.parts.some(part => part.type === "text" && part.text);
  const statusLabel = awaitingApproval ? "承認待ち" : busy ? "実行中" : "待機中";
  const inputHint = awaitingApproval ? "本文はまだ取得されていません"
    : documentIds.length === 0 ? "参照する記事を1件以上選んでください"
    : `架空データのみ・最大${MAX_STEPS}ステップ`;

  function respondToApproval(id: string, approved: boolean) {
    void addToolApprovalResponse({
      id,
      approved,
      ...(!approved && {
        reason: "ユーザーが本文取得を拒否しました。同じ記事を再取得しないでください。",
      }),
    });
  }

  function send(text: string) {
    if (!text.trim() || inputDisabled || documentIds.length === 0) return;
    clearError();
    setSourcesOpen(false);
    void sendMessage({ text: text.trim() }, { body: { documentIds } });
    setInput("");
  }

  function resetConversation() {
    setMessages([]);
    clearError();
  }

  function retry() {
    clearError();
    void sendMessage();
  }

  return (
    <main>
      <header>
        <div>
          <h1>Agent Lab<span className="badge">Preview</span></h1>
          <p>ドキュメントを探す、小さなアシスタント。</p>
        </div>
        <button disabled={busy} onClick={resetConversation}>新しい会話</button>
      </header>
      <div className="conversation-layout">
        <section className="panel chat" aria-label="チャット">
          <div className="panel-title">
            <h2>ドキュメントに質問</h2>
            <span aria-live="polite">{statusLabel}</span>
          </div>
          <div className="messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="empty">
                <h3>気になることを、<br />聞いてみてください。</h3>
                <p>参照する記事を選んで、配送や返品について質問できます。</p>
                <div className="examples">
                  {examples.map(example => (
                    <button key={example} disabled={documentIds.length === 0} onClick={() => send(example)}>
                      {example} ↗
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ChatMessages messages={messages} busy={busy} onApproval={respondToApproval} />
            {status === "submitted" && <p className="muted activity">参照する記事を確認しています…</p>}
            {status === "streaming" && <p className="muted activity">エージェントが処理しています…</p>}
            {endedWithoutAnswer && (
              <p className="notice">回答を生成せず終了しました。ステップ上限に達した可能性があります。質問を絞って新しい会話で試してください。</p>
            )}
            {error && (
              <div role="alert" className="notice">
                <p>{error.message.startsWith("{")
                  ? "実行できませんでした。設定・認証を確認してください。会話が長い場合は新しい会話で試してください。"
                  : error.message}</p>
                <button type="button" disabled={busy} onClick={retry}>再試行</button>
              </div>
            )}
          </div>
          <form onSubmit={event => { event.preventDefault(); send(input); }}>
            <SourcePicker
              documentIds={documentIds}
              sourcesOpen={sourcesOpen}
              selectionLocked={selectionLocked}
              onToggle={() => setSourcesOpen(!sourcesOpen)}
              onSelect={(id, selected) => setDocumentIds(ids => selected
                ? [...ids, id] : ids.filter(value => value !== id))}
            />
            <label className="sr-only" htmlFor="question">質問</label>
            <textarea
              id="question"
              value={input}
              maxLength={2000}
              onChange={event => setInput(event.target.value)}
              placeholder={awaitingApproval ? "本文取得の承認か拒否を選んでください" : "記事について聞いてみる…"}
              rows={2}
              disabled={inputDisabled}
            />
            <div className="form-footer">
              <small>{inputHint}</small>
              {busy
                ? <button type="button" onClick={() => void stop()}>停止</button>
                : <button className="primary" disabled={!input.trim() || awaitingApproval || documentIds.length === 0} type="submit">送信 ↑</button>}
            </div>
          </form>
        </section>
        <p className="conversation-note">記事の検索・取得状況は会話内に表示されます。クリックすると詳細を確認できます。</p>
      </div>
    </main>
  );
}
