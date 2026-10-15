"use client";

import { useChat } from "@ai-sdk/react";
import { isToolUIPart } from "ai";
import { useState } from "react";
import { documents } from "../lib/documents";

const examples = ["送料はいくらですか？", "返品の条件と申請方法を教えて", "海外配送はできますか？"];

export default function Page() {
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat();
  const [input, setInput] = useState("");
  const [documentIds, setDocumentIds] = useState(documents.map(document => document.id));
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const busy = status === "submitted" || status === "streaming";
  const selectionLocked = busy || messages.length > 0;

  function send(text: string) {
    if (!text.trim() || busy || documentIds.length === 0) return;
    clearError();
    setSourcesOpen(false);
    void sendMessage({ text: text.trim() }, { body: { documentIds } });
    setInput("");
  }

  return <main>
    <header>
      <div><h1>Agent Lab<span className="badge">Preview</span></h1><p>ドキュメントを探す、小さなアシスタント。</p></div>
      <button disabled={busy} onClick={() => { setMessages([]); clearError(); }}>新しい会話</button>
    </header>
    <div className="conversation-layout">
      <section className="panel chat" aria-label="チャット">
        <div className="panel-title"><h2>ドキュメントに質問</h2><span aria-live="polite">{busy ? "実行中" : "待機中"}</span></div>
        <div className="messages" aria-live="polite">
          {messages.length === 0 && <div className="empty">
            <h3>気になることを、<br />聞いてみてください。</h3>
            <p>参照する記事を選んで、配送や返品について質問できます。</p>
            <div className="examples">{examples.map(example => <button key={example} disabled={documentIds.length === 0} onClick={() => send(example)}>{example} ↗</button>)}</div>
          </div>}
          {messages.map(message => {
            let step = 0;
            return <article className={`message ${message.role}`} key={message.id}>
              <strong>{message.role === "user" ? "あなた" : "エージェント"}</strong>
              {message.parts.map((part, index) => {
                if (part.type === "step-start") { step++; return null; }
                if (part.type === "text") return <p key={index}>{part.text}</p>;
                if (!isToolUIPart(part)) return null;
                const name = part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
                const done = part.state === "output-available";
                const failed = part.state === "output-error";
                const active = !done && !failed && busy && message.id === messages.at(-1)?.id;
                const args = part.input as { query?: string; id?: string } | undefined;
                const subject = name === "searchDocuments" ? args?.query : documents.find(document => document.id === args?.id)?.title;
                const action = name === "searchDocuments" ? "記事を検索" : name === "readDocument" ? "本文を確認" : name;
                return <details key={part.toolCallId} className={`inline-tool ${active ? "active" : ""}`}>
                  <summary><span className="tool-indicator" aria-hidden="true">{failed ? "!" : done ? "✓" : "·"}</span><span>{action}{active ? "中" : done ? "済み" : failed ? "に失敗" : "・中断"}{subject ? `：${subject}` : ""}</span><span className="tool-step">{step} / 6</span></summary>
                  <div className="tool-details"><code>{name}</code><h4>引数</h4><pre>{JSON.stringify(part.input ?? {}, null, 2)}</pre>
                    {done && <><h4>結果</h4><pre>{JSON.stringify(part.output, null, 2)}</pre></>}
                    {failed && <p role="alert">{part.errorText}</p>}
                  </div>
                </details>;
              })}
            </article>;
          })}
          {status === "submitted" && <p className="muted activity">参照する記事を確認しています…</p>}
          {status === "streaming" && <p className="muted activity">エージェントが処理しています…</p>}
          {!busy && messages.at(-1)?.role === "assistant" && !messages.at(-1)?.parts.some(part => part.type === "text" && part.text) && <p className="notice">回答を生成せず終了しました。ステップ上限に達した可能性があります。質問を絞って新しい会話で試してください。</p>}
          {error && <p role="alert" className="notice">{error.message.startsWith("{") ? "実行できませんでした。設定・認証を確認してください。会話が長い場合は新しい会話で試してください。" : error.message}</p>}
        </div>
        <form onSubmit={event => { event.preventDefault(); send(input); }}>
          <div className="source-controls">
            <button type="button" className="source-trigger" aria-expanded={sourcesOpen} aria-controls="source-picker" onClick={() => setSourcesOpen(!sourcesOpen)}>＋ 参照する記事 <span>{documentIds.length}件</span></button>
            <span className="source-caption">{documentIds.length === documents.length ? "すべての記事" : documents.filter(document => documentIds.includes(document.id)).map(document => document.title).join("・") || "未選択"}</span>
          </div>
          {sourcesOpen && <div id="source-picker" className="source-picker">
            <div className="source-heading"><h3>参照する記事</h3><span>架空のサンプルデータ</span></div>
            <p className="muted">{selectionLocked ? "参照先を変更するには「新しい会話」を始めてください。" : "選んだ記事だけを使って回答します。"}</p>
            <fieldset disabled={selectionLocked}>
              <legend className="sr-only">参照する記事を選択</legend>
              {documents.map(document => <div className="source-item" key={document.id}>
                <label><input type="checkbox" checked={documentIds.includes(document.id)} onChange={event => setDocumentIds(ids => event.target.checked ? [...ids, document.id] : ids.filter(id => id !== document.id))} /><span>{document.title}<small>{document.summary}</small></span></label>
                <details id={`doc-${document.id}`}><summary>本文を見る</summary><p>{document.body}</p></details>
              </div>)}
            </fieldset>
          </div>}
          <label className="sr-only" htmlFor="question">質問</label>
          <textarea id="question" value={input} maxLength={2000} onChange={event => setInput(event.target.value)} placeholder="記事について聞いてみる…" rows={2} disabled={busy} />
          <div className="form-footer"><small>{documentIds.length === 0 ? "参照する記事を1件以上選んでください" : "架空データのみ・最大6ステップ"}</small>{busy ? <button type="button" onClick={() => void stop()}>停止</button> : <button className="primary" disabled={!input.trim() || documentIds.length === 0} type="submit">送信 ↑</button>}</div>
        </form>
      </section>
      <p className="conversation-note">記事の検索・取得状況は会話内に表示されます。クリックすると詳細を確認できます。</p>
    </div>
  </main>;
}
