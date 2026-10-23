# AI実装のサンプル

SDK・フレームワークごとに実装と試し方をまとめています。

| ディレクトリ | 読み始めるファイル | 確認する仕組み |
| --- | --- | --- |
| [google-genai](google-genai/README.md) | `run.ts` | アプリ側で組む関数呼び出しのループ |
| [ai-sdk](ai-sdk/README.md) | `run.ts` | ToolLoopAgentのツール実行 |
| [adk](adk/README.md) | `run.ts` | LlmAgent・Runnerの実行イベント |
| [mastra](mastra/README.md) | `run.ts` | Agentと型付きツールの組み合わせ |
| [langgraph](langgraph/README.md) | `run.ts` | モデル・ツールのノードと条件分岐 |
| [llamaindex](llamaindex/README.md) | `run.ts` | 文書分割・Embedding・ベクトル検索 |
| [langchain](langchain/README.md) | `run.ts` | createAgentによる標準エージェントループ |
| [shared](shared/README.md) | `run.ts`、`context.ts` | 設定・記事操作・実装の選択 |

依存関係のインストールと起動はリポジトリルートで行います。

```sh
npm ci
# .env.localとGoogle Cloud認証の設定はルートREADMEを参照
npm run dev
```

<http://localhost:3000/lab> で実装を選択して試せます。
画面は`app/lab/`、APIは`app/api/lab/`にあります。各実装のテストは`tests/lab.test.ts`にあります。
共通のサンプル記事と質問、結果の確認方法は[比較アプリのガイド](../docs/framework-lab.md)を参照してください。
