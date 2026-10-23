"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { frameworks, type FrameworkId } from "@/lib/lab/catalog";
import type { LabResult } from "@/lib/lab/types";
import { documents } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type SavedResult = LabResult & { question: string; documentIds: string[] };
const examples = ["送料はいくらですか？", "返品の条件と申請方法を教えて", "海外配送はできますか？"];

export function FrameworkLab() {
  const [selected, setSelected] = useState<FrameworkId>("google");
  const [question, setQuestion] = useState(examples[0]);
  const [documentIds, setDocumentIds] = useState(documents.map(doc => doc.id));
  const [results, setResults] = useState<Partial<Record<FrameworkId, SavedResult>>>({});
  const [running, setRunning] = useState<FrameworkId | null>(null);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const active = frameworks.find(item => item.id === selected)!;
  const result = results[selected];

  async function run() {
    if (controller.current || !question.trim() || !documentIds.length) return;
    const request = { framework: selected, question: question.trim(), documentIds: [...documentIds] };
    const abort = new AbortController();
    controller.current = abort;
    setRunning(selected);
    setError("");
    try {
      const response = await fetch("/api/lab", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request), signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "実行に失敗しました。");
      setResults(previous => ({ ...previous, [request.framework]: { ...data, question: request.question, documentIds: request.documentIds } }));
    } catch (cause) {
      setError(abort.signal.aborted ? "実行を停止しました。" : cause instanceof Error ? cause.message : "実行に失敗しました。");
    } finally {
      controller.current = null;
      setRunning(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3"><span className="text-sm font-medium">Agent Lab</span><Badge variant="outline">7 implementations</Badge></div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">同じ質問を、違う仕組みで。</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">架空の店舗記事を使って、7種類のSDK・フレームワークの回答と実行経路を試せます。</p>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/">承認付きチャットへ</Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-col" aria-label="実装を選択">
          {frameworks.map((item, index) => (
            <button key={item.id} type="button" disabled={running !== null}
              aria-pressed={selected === item.id}
              onClick={() => { setSelected(item.id); setError(""); }}
              className={`rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${selected === item.id ? "border-foreground bg-muted" : "hover:bg-muted/50"}`}>
              <span className="mb-2 block text-xs text-muted-foreground">0{index + 1} · {item.category}</span>
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">{results[item.id] ? `実行済み · ${(results[item.id]!.elapsedMs / 1000).toFixed(1)}秒` : item.description}</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="implementation-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="implementation-heading" className="text-lg font-semibold">{active.name}</h2>
              <a className="text-xs underline underline-offset-4" href={active.href} target="_blank" rel="noreferrer">公式ドキュメント ↗</a>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{active.description}</p>
            <p className="mt-2 break-words font-mono text-xs text-muted-foreground">{active.package}</p>

            <form className="mt-6 space-y-4" onSubmit={event => { event.preventDefault(); void run(); }}>
              <fieldset disabled={running !== null} className="space-y-3">
                <legend className="mb-2 text-sm font-medium">参照する記事</legend>
                <div className="flex flex-wrap gap-4">
                  {documents.map(doc => <label key={doc.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={documentIds.includes(doc.id)} onChange={event => setDocumentIds(ids => event.target.checked ? [...ids, doc.id] : ids.filter(id => id !== doc.id))} />{doc.title}
                  </label>)}
                </div>
              </fieldset>
              <label className="block text-sm font-medium" htmlFor="lab-question">質問</label>
              <Textarea id="lab-question" value={question} maxLength={2000} rows={3} disabled={running !== null} onChange={event => setQuestion(event.target.value)} />
              <div className="flex flex-wrap gap-2">{examples.map(text => <Button key={text} type="button" variant="outline" size="sm" className="h-auto whitespace-normal text-left" disabled={running !== null} onClick={() => setQuestion(text)}>{text}</Button>)}</div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-xs leading-5 text-muted-foreground">1回ごとに独立した質問です。実行時にVertex AIの利用料金が発生します。</p>
                {running ? <Button type="button" variant="outline" onClick={() => controller.current?.abort()}>停止</Button> : <Button type="submit" disabled={!question.trim() || documentIds.length === 0}>この実装で質問</Button>}
              </div>
              {documentIds.length === 0 && <p className="text-sm" role="status">参照する記事を1件以上選んでください。</p>}
              {running && <p className="text-sm" role="status">{active.name}で実行中…</p>}
              {error && <p className="rounded-lg border p-3 text-sm leading-6" role="alert">{error}</p>}
            </form>
          </section>

          {result ? <section className="rounded-xl border bg-card p-5 sm:p-6" aria-label="実行結果">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">実行結果</h2><span className="text-xs text-muted-foreground">{(result.elapsedMs / 1000).toFixed(1)}秒 · {result.traces.length}件の処理</span></div>
            <p className="mt-4 text-sm font-medium">質問：{result.question}</p>
            <p className="mt-1 text-xs text-muted-foreground">参照範囲：{documents.filter(doc => result.documentIds.includes(doc.id)).map(doc => doc.title).join("、")}</p>
            <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7">{result.answer}</p>
            <div className="mt-5 border-t pt-4"><h3 className="text-sm font-medium">取得した記事</h3>
              {result.sources.length ? <div className="mt-2 flex flex-wrap gap-2">{result.sources.map(source => <a key={source.id} className="text-sm underline underline-offset-4" href={`#lab-doc-${source.id}`}>{source.title}</a>)}</div> : <p className="mt-2 text-xs text-muted-foreground">本文の取得はありません。</p>}
            </div>
            <h3 className="mt-6 mb-2 text-sm font-medium">実行履歴</h3>
            <div className="space-y-2">{result.traces.map((trace, index) => <details key={index} className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm">{index + 1}. {trace.name}</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs leading-6">{JSON.stringify({ input: trace.input, output: trace.output }, null, 2)}</pre>
            </details>)}</div>
          </section> : <div className="rounded-xl border border-dashed p-6 text-sm leading-7 text-muted-foreground">質問を実行すると、ここに回答・取得した記事・実行履歴を表示します。結果は実装ごとに保持するので、切り替えて確認できます。</div>}

          <section className="rounded-xl border p-5 sm:p-6" aria-label="サンプル記事">
            <h2 className="mb-3 text-sm font-semibold">共通のサンプル記事</h2>
            <div className="space-y-3">{documents.map(doc => <details id={`lab-doc-${doc.id}`} key={doc.id} className="scroll-mt-5 rounded-lg bg-muted/50 p-3">
              <summary className="cursor-pointer text-sm">{doc.title}</summary><p className="mt-3 text-sm leading-7">{doc.body}</p>
            </details>)}</div>
          </section>
          <p className="text-xs leading-6 text-muted-foreground">回答はプレーンテキストで表示します。結果は再読み込みで消えます。処理手順や検索方式が異なるため、応答時間だけで性能の優劣は判断できません。</p>
        </div>
      </div>
    </main>
  );
}
