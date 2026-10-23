# 共通処理

| ファイル | 役割 |
| --- | --- |
| `catalog.ts` | 比較画面に表示する実装の一覧 |
| `types.ts` | 質問・回答・実行履歴の共通型 |
| `context.ts` | Vertex設定、参照範囲の検証、検索・本文取得、履歴の記録 |
| `request.ts` | 比較APIへの入力検証 |
| `run.ts` | 選択された実装のロードと実行時間の計測 |
| `google-client.ts` | Google SDK・LlamaIndexで使うVertex接続 |
| `langchain.ts` | LangChain・LangGraphで使うモデルとツール |

架空の記事は[`../../lib/documents.ts`](../../lib/documents.ts)、エージェントの共通指示は[`../../lib/agent-config.ts`](../../lib/agent-config.ts)を使用します。
