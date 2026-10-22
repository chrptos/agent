import { tool } from "ai";
import { z } from "zod";
import { readDocument, searchDocuments } from "./documents";

export function createDocumentTools(documentIds: string[], requireReadApproval: boolean) {
  const allowedIds = new Set(documentIds);

  return {
    searchDocuments: tool({
      description: "短いキーワードで架空の記事を検索する。記事ID、タイトル、概要を返す。本文はreadDocumentで取得する。",
      inputSchema: z.object({ query: z.string().trim().min(1).max(100) }),
      execute: async ({ query }) => ({
        documents: searchDocuments(query).filter(document => allowedIds.has(document.id)),
      }),
    }),
    readDocument: tool({
      description: "検索結果または記事中の参照にある記事IDから本文を取得する。",
      inputSchema: z.object({ id: z.string().trim().min(1).max(100) }),
      needsApproval: requireReadApproval,
      execute: async ({ id }) => allowedIds.has(id)
        ? readDocument(id)
        : { found: false as const, id, message: "この記事は参照対象に選択されていません。" },
    }),
  };
}
