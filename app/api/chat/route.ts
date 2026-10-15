import { createAgentUIStreamResponse, validateUIMessages } from "ai";
import { createDocumentAgent } from "../../../lib/agent";
import { documents } from "../../../lib/documents";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.GOOGLE_VERTEX_PROJECT) {
    return Response.json({ error: "Vertex AIの設定がありません。.env.localを設定してください。" }, { status: 503 });
  }
  let agent;
  let messages;
  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length > 40 || JSON.stringify(body).length > 100_000) {
      throw new Error("Invalid messages");
    }
    const documentIds = z.array(z.string().refine(id => documents.some(document => document.id === id))).min(1).max(documents.length).parse(body.documentIds);
    agent = createDocumentAgent(undefined, documentIds);
    messages = await validateUIMessages({ messages: body.messages, tools: agent.tools });
  } catch {
    return Response.json({ error: "入力が不正、または会話が長すぎます。新しい会話でお試しください。" }, { status: 400 });
  }
  try {
    return await createAgentUIStreamResponse({
      agent, uiMessages: messages,
      abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]),
      onError: () => "実行に失敗しました。Vertex AIの設定・認証・利用権限を確認してください。",
    });
  } catch {
    return Response.json({ error: "実行を開始できませんでした。Vertex AIの設定・認証を確認してください。" }, { status: 502 });
  }
}
