export const frameworks = [
  { id: "google", name: "Google Gen AI SDK", category: "モデルを直接使う", description: "関数呼び出しの実行ループをアプリ側で組み立てます。", package: "@google/genai", href: "https://github.com/googleapis/js-genai" },
  { id: "ai-sdk", name: "Vercel AI SDK", category: "共通API", description: "ToolLoopAgentに検索と本文取得を渡します。", package: "ai / @ai-sdk/google-vertex", href: "https://ai-sdk.dev/docs/introduction" },
  { id: "adk", name: "Google ADK", category: "エージェント", description: "LlmAgentとRunnerでツールと実行イベントを扱います。", package: "@google/adk", href: "https://adk.dev/" },
  { id: "mastra", name: "Mastra", category: "エージェント", description: "Agentと型付きツールで検索アシスタントを作ります。", package: "@mastra/core", href: "https://mastra.ai/docs" },
  { id: "langgraph", name: "LangGraph", category: "実行グラフ", description: "モデルとツールのノードを条件付きの辺でつなぎます。", package: "@langchain/langgraph", href: "https://docs.langchain.com/oss/javascript/langgraph/overview" },
  { id: "llamaindex", name: "LlamaIndex", category: "RAG", description: "記事を分割してベクトル索引を作り、関連する本文を取得します。", package: "llamaindex / @google/genai", href: "https://developers.llamaindex.ai/typescript/framework/" },
  { id: "langchain", name: "LangChain", category: "エージェント", description: "createAgentにモデルと検索ツールを渡して実行します。", package: "langchain / @langchain/google-vertexai", href: "https://docs.langchain.com/oss/javascript/langchain/overview" },
] as const;

export type FrameworkId = typeof frameworks[number]["id"];
