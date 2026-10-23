import { z } from "zod";
import { documents, readDocument, searchDocuments } from "../documents";
import { createInstructions } from "../agent-config";
import type { RunInput, Trace } from "./types";

export const searchSchema = z.object({ query: z.string().trim().min(1).max(100) });
export const readSchema = z.object({ id: z.string().trim().min(1).max(100) });

export function vertexConfig() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  if (!project || project === "your-project-id") throw new Error("Vertex AI project is not configured");
  return { project, location: process.env.GOOGLE_VERTEX_LOCATION || "global", model: process.env.GOOGLE_VERTEX_MODEL || "gemini-2.5-flash" };
}

export function createRunContext(input: RunInput) {
  const allowed = new Set(input.documentIds);
  const traces: Trace[] = [];
  const sources = new Map<string, { id: string; title: string }>();
  function record(name: string, args: unknown, output: unknown) {
    input.signal.throwIfAborted();
    traces.push({ name, input: args, output });
    return output;
  }
  const tools = {
    searchDocuments: {
      description: "短いキーワードで記事を検索する。記事ID・タイトル・概要を返す。本文はreadDocumentで取得する。",
      schema: searchSchema,
      execute: async (args: z.infer<typeof searchSchema>) => {
        input.signal.throwIfAborted();
        const parsed = searchSchema.parse(args);
        const output = { documents: searchDocuments(parsed.query).filter(doc => allowed.has(doc.id)) };
        record("searchDocuments", parsed, output);
        return output;
      },
    },
    readDocument: {
      description: "検索結果の記事IDから本文を取得する。記事内の参照先も必要なら取得する。",
      schema: readSchema,
      execute: async (args: z.infer<typeof readSchema>) => {
        input.signal.throwIfAborted();
        const parsed = readSchema.parse(args);
        const output = allowed.has(parsed.id) ? readDocument(parsed.id) : { found: false as const, id: parsed.id, message: "参照対象外の記事です。" };
        if (output.found) sources.set(output.id, { id: output.id, title: output.title });
        record("readDocument", parsed, output);
        return output;
      },
    },
  };
  return {
    tools, traces, record,
    instructions: createInstructions(input.documentIds),
    selectedDocuments: documents.filter(doc => allowed.has(doc.id)),
    finish: (answer: string) => ({
      answer: answer.trim() || "回答を生成せず終了しました。ステップ上限や実行履歴を確認してください。",
      traces, sources: [...sources.values()],
    }),
  };
}
