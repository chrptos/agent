import { labRequestSchema } from "@/lib/lab/request";
import { runFramework } from "@/lib/lab/run";
import { vertexConfig } from "@/lib/lab/shared";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body;
  try {
    const text = await request.text();
    if (text.length > 10_000) throw new Error("Request too large");
    body = labRequestSchema.parse(JSON.parse(text));
  } catch {
    return Response.json({ error: "入力が不正です。質問は2,000文字以内、参照記事は1件以上選んでください。" }, { status: 400 });
  }
  try { vertexConfig(); } catch {
    return Response.json({ error: "Vertex AIの設定がありません。.env.localのGOOGLE_VERTEX_PROJECTを設定してください。" }, { status: 503 });
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]);
  try {
    const result = await runFramework(body.framework, { ...body, signal });
    return Response.json(result);
  } catch {
    return Response.json({ error: signal.aborted ? "実行が停止、またはタイムアウトしました。質問を絞って再試行してください。" : "実行に失敗しました。Vertex AIの認証・権限・モデル・リージョンを確認してください。" }, { status: signal.aborted ? 504 : 502 });
  }
}
