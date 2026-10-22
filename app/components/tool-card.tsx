import {
  CheckIcon,
  FileTextIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemMedia,
} from "@/components/ui/item";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
} from "@/components/ui/trace";
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

export function ToolCard({
  part,
  step,
  busy,
  isLatest,
  onApproval,
}: ToolCardProps) {
  const name =
    part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  const needsApproval = part.state === "approval-requested";
  const denied =
    part.state === "output-denied" ||
    (part.state === "approval-responded" && !part.approval.approved);
  const approved =
    part.state === "approval-responded" && part.approval.approved;
  const active =
    !done && !failed && !needsApproval && !denied && busy && isLatest;
  const args = part.input as { query?: string; id?: string } | undefined;
  const subject =
    name === "searchDocuments"
      ? args?.query
      : documents.find((document) => document.id === args?.id)?.title;
  const action =
    name === "searchDocuments"
      ? "記事を検索"
      : name === "readDocument"
        ? "本文を確認"
        : name;

  if (needsApproval) {
    return (
      <Item
        variant="outline"
        className="bg-muted/40 p-4"
        role="group"
        aria-label="本文取得の承認"
      >
        <ItemMedia variant="icon">
          <ShieldCheckIcon />
        </ItemMedia>
        <ItemContent className="min-w-0 basis-full sm:basis-auto">
          <ItemTitle className="line-clamp-none">
            「{subject || args?.id || "記事"}」の本文を取得しますか？
          </ItemTitle>
          <ItemDescription className="line-clamp-none">
            承認すると、本文を取得してAIに渡し、回答を続けます。
          </ItemDescription>
          <Trace>
            <TraceCollapsible>
              <TraceCollapsibleTrigger>
                <TraceLine>
                  <TraceTitle>ツールと引数を確認</TraceTitle>
                </TraceLine>
              </TraceCollapsibleTrigger>
              <TraceCollapsibleContent>
                <p className="mb-2 text-xs">{name}</p>
                <CodeBlock size="sm">
                  <CodeBlockContent wrap>
                    {JSON.stringify(part.input, null, 2)}
                  </CodeBlockContent>
                </CodeBlock>
              </TraceCollapsibleContent>
            </TraceCollapsible>
          </Trace>
        </ItemContent>
        <ItemActions className="ml-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onApproval(part.approval.id, false)}
          >
            拒否
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => onApproval(part.approval.id, true)}
          >
            承認して実行
          </Button>
        </ItemActions>
      </Item>
    );
  }

  const statusLabel = denied
    ? "・拒否済み"
    : active
      ? "中"
      : done
        ? "済み"
        : failed
          ? "に失敗"
          : approved
            ? "・承認済み"
            : "・中断";

  return (
    <Trace>
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine status={failed ? "error" : active ? "running" : undefined}>
            <TraceIcon>
              {done ? (
                <CheckIcon />
              ) : name === "searchDocuments" ? (
                <SearchIcon />
              ) : (
                <FileTextIcon />
              )}
            </TraceIcon>
            <TraceTitle>
              {action}
              {statusLabel}
              {subject ? `：${subject}` : ""}
            </TraceTitle>
            <TraceDescription>
              {step} / {MAX_STEPS}
            </TraceDescription>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="space-y-2">
          <p className="text-xs">{name} · 引数</p>
          <CodeBlock size="sm">
            <CodeBlockContent wrap className="max-h-64">
              {JSON.stringify(part.input ?? {}, null, 2)}
            </CodeBlockContent>
          </CodeBlock>
          {done && (
            <>
              <p className="text-xs">結果</p>
              <CodeBlock size="sm">
                <CodeBlockContent wrap className="max-h-64">
                  {JSON.stringify(part.output, null, 2)}
                </CodeBlockContent>
              </CodeBlock>
            </>
          )}
          {failed && <p role="alert">{part.errorText}</p>}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
