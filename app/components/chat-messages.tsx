import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { isToolUIPart, type UIMessage } from "ai";
import { ToolCard, type ApprovalHandler } from "./tool-card";

type ChatMessagesProps = {
  messages: UIMessage[];
  busy: boolean;
  onApproval: ApprovalHandler;
};

export function ChatMessages({
  messages,
  busy,
  onApproval,
}: ChatMessagesProps) {
  return (
    <>
      {messages.map((message) => {
        let step = 0;
        return (
          <MessageScrollerItem
            key={message.id}
            messageId={message.id}
            scrollAnchor={message.role === "user"}
          >
            <Message align={message.role === "user" ? "end" : "start"}>
              <MessageContent>
                <MessageHeader>
                  {message.role === "user" ? "あなた" : "エージェント"}
                </MessageHeader>
                {message.parts.map((part, index) => {
                  if (part.type === "step-start") {
                    step++;
                    return null;
                  }
                  if (part.type === "text")
                    return (
                      <Bubble
                        key={index}
                        variant={message.role === "user" ? "muted" : "ghost"}
                      >
                        <BubbleContent className="whitespace-pre-wrap leading-7">
                          {part.text}
                        </BubbleContent>
                      </Bubble>
                    );
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
              </MessageContent>
            </Message>
          </MessageScrollerItem>
        );
      })}
    </>
  );
}
