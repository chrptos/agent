"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpIcon, PlusIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
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
  const [documentIds, setDocumentIds] = useState(
    documents.map((document) => document.id),
  );
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
    clearError,
    addToolApprovalResponse,
  } = useChat({
    transport: new DefaultChatTransport({ body: { documentIds } }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const lastMessage = messages.at(-1);
  const busy = status === "submitted" || status === "streaming";
  const awaitingApproval =
    lastMessage?.parts.some(
      (part) => isToolUIPart(part) && part.state === "approval-requested",
    ) ?? false;
  const selectionLocked = busy || messages.length > 0;
  const inputDisabled = busy || awaitingApproval;
  const endedWithoutAnswer =
    !busy &&
    !awaitingApproval &&
    lastMessage?.role === "assistant" &&
    !lastMessage.parts.some((part) => part.type === "text" && part.text);
  const statusLabel = awaitingApproval
    ? "承認待ち"
    : busy
      ? "実行中"
      : "待機中";
  const inputHint = awaitingApproval
    ? "本文はまだ取得されていません"
    : documentIds.length === 0
      ? "参照する記事を1件以上選んでください"
      : `架空データのみ・最大${MAX_STEPS}ステップ`;

  function respondToApproval(id: string, approved: boolean) {
    void addToolApprovalResponse({
      id,
      approved,
      ...(!approved && {
        reason:
          "ユーザーが本文取得を拒否しました。同じ記事を再取得しないでください。",
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
    <main className="mx-auto flex h-dvh max-w-4xl flex-col px-4 py-5 sm:px-8 sm:py-8">
      <header className="mb-6 flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            Agent Lab<Badge variant="outline">Preview</Badge>
          </h1>
          <Link href="/lab" className="mt-1 block text-xs text-muted-foreground underline underline-offset-4">7種類の実装を比較する ↗</Link>
        </div>
        <Button variant="outline" disabled={busy} onClick={resetConversation}>
          <PlusIcon />
          新しい会話
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
          aria-label="チャット"
        >
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 text-xs">
            <h2 className="font-medium">ドキュメントに質問</h2>
            <span className="text-muted-foreground" aria-live="polite">
              {statusLabel}
            </span>
          </div>
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport aria-live="polite">
                <MessageScrollerContent className="p-5 sm:p-8">
                  {messages.length === 0 && (
                    <div className="my-auto">
                      <h3 className="text-2xl leading-relaxed font-medium tracking-tight sm:text-3xl">
                        気になることを、
                        <br />
                        聞いてみてください。
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        参照する記事を選んで、配送や返品について質問できます。
                      </p>
                      <div className="mt-7 flex flex-wrap gap-2">
                        {examples.map((example) => (
                          <Button
                            variant="outline"
                            className="h-auto whitespace-normal py-2 text-left"
                            key={example}
                            disabled={documentIds.length === 0}
                            onClick={() => send(example)}
                          >
                            {example} ↗
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <ChatMessages
                    messages={messages}
                    busy={busy}
                    onApproval={respondToApproval}
                  />
                  {status === "submitted" && (
                    <p className="text-xs text-muted-foreground">
                      参照する記事を確認しています…
                    </p>
                  )}
                  {status === "streaming" && (
                    <p className="text-xs text-muted-foreground">
                      エージェントが処理しています…
                    </p>
                  )}
                  {endedWithoutAnswer && (
                    <p className="rounded-lg border bg-muted/50 p-4 text-sm leading-7">
                      回答を生成せず終了しました。ステップ上限に達した可能性があります。質問を絞って新しい会話で試してください。
                    </p>
                  )}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border bg-muted/50 p-4 text-sm leading-7"
                    >
                      <p>
                        {error.message.startsWith("{")
                          ? "実行できませんでした。設定・認証を確認してください。会話が長い場合は新しい会話で試してください。"
                          : error.message}
                      </p>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={busy}
                        onClick={retry}
                      >
                        再試行
                      </Button>
                    </div>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton aria-label="最新のメッセージへ" />
            </MessageScroller>
          </MessageScrollerProvider>
          <form
            className="shrink-0 border-t p-3 sm:p-4"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <InputGroup className="bg-card has-disabled:bg-card has-disabled:opacity-100">
              <label className="sr-only" htmlFor="question">
                質問
              </label>
              <InputGroupTextarea
                className="min-h-20 px-3"
                id="question"
                value={input}
                maxLength={2000}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  awaitingApproval
                    ? "本文取得の承認か拒否を選んでください"
                    : "記事について聞いてみる…"
                }
                rows={2}
                disabled={inputDisabled}
              />
              <InputGroupAddon
                align="block-end"
                className="justify-between gap-3"
              >
                <SourcePicker
                  documentIds={documentIds}
                  sourcesOpen={sourcesOpen}
                  selectionLocked={selectionLocked}
                  onToggle={() => setSourcesOpen(!sourcesOpen)}
                  onSelect={(id, selected) =>
                    setDocumentIds((ids) =>
                      selected
                        ? [...ids, id]
                        : ids.filter((value) => value !== id),
                    )
                  }
                />
                <small className="min-w-0 flex-1 text-xs font-normal">
                  {inputHint}
                </small>
                {busy ? (
                  <InputGroupButton
                    size="sm"
                    variant="outline"
                    onClick={() => void stop()}
                  >
                    <SquareIcon />
                    停止
                  </InputGroupButton>
                ) : (
                  <InputGroupButton
                    size="icon-sm"
                    variant="default"
                    className="shrink-0 rounded-full"
                    aria-label="送信"
                    disabled={
                      !input.trim() ||
                      awaitingApproval ||
                      documentIds.length === 0
                    }
                    type="submit"
                  >
                    <ArrowUpIcon />
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
          </form>
        </section>
        <p className="shrink-0 text-center text-xs leading-5 text-muted-foreground">
          記事の検索・取得状況は会話内に表示されます。クリックすると詳細を確認できます。
        </p>
      </div>
    </main>
  );
}
