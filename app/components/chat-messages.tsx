import { isToolUIPart, type UIMessage } from "ai";
import { ToolCard, type ApprovalHandler } from "./tool-card";

type ChatMessagesProps = {
  messages: UIMessage[];
  busy: boolean;
  onApproval: ApprovalHandler;
};

export function ChatMessages({ messages, busy, onApproval }: ChatMessagesProps) {
  return (
    <>
      {messages.map(message => {
        let step = 0;
        return (
          <article className={`message ${message.role}`} key={message.id}>
            <strong>{message.role === "user" ? "あなた" : "エージェント"}</strong>
            {message.parts.map((part, index) => {
              if (part.type === "step-start") {
                step++;
                return null;
              }
              if (part.type === "text") return <p key={index}>{part.text}</p>;
              if (!isToolUIPart(part)) return null;
              return (
                <ToolCard
                  key={part.toolCallId}
                  part={part}
                  step={step}
                  busy={busy}
                  isLatest={message.id === messages.at(-1)?.id}
                  onApproval={onApproval}
                />
              );
            })}
          </article>
        );
      })}
    </>
  );
}
