# 7種類のAI実装を試す

`npm ci`、READMEのVertex AI認証を設定し、`npm run dev`で起動して <http://localhost:3000/lab> を開く。
各ライブラリを実際に利用するサーバー実装を、共通のUIから選んで実行できる。

## 操作

1. 実装を選択する。
2. 参照する記事と質問を設定する。
3. 「この実装で質問」を押す。
4. 回答、取得した記事、実行履歴を確認する。
5. 別の実装に切り替え、同じ質問を実行する。

結果には実行時の質問・参照範囲を記録する。実装ごとに直近の結果を保持し、再読み込みで消える。
実行は1件ずつ行い、選択した実装だけがVertex AIへリクエストする。
会話履歴をモデルへ送らない、独立した1問1答の比較アプリ。
本文取得は自動実行する。承認操作を試す場合は既存の `/` を使用する。

## 実装

各サンプルは`examples/<SDK名>/`に分かれており、実装の`run.ts`と試し方の`README.md`を置いています。
共通処理は`examples/shared/`、比較画面は`app/lab/`、APIは`app/api/lab/`です。
全体の入口は[サンプル一覧](../examples/README.md)を参照してください。

| 実装 | ファイル | ライブラリに任せる処理 |
| --- | --- | --- |
| Google Gen AI SDK | [`examples/google-genai/run.ts`](../examples/google-genai/run.ts) | Geminiへの接続。関数呼び出しの往復はアプリが実装 |
| Vercel AI SDK | [`examples/ai-sdk/run.ts`](../examples/ai-sdk/run.ts) | `ToolLoopAgent`によるモデルとツールのループ |
| Google ADK | [`examples/adk/run.ts`](../examples/adk/run.ts) | `LlmAgent`、`FunctionTool`、`InMemoryRunner`による実行とイベント |
| Mastra | [`examples/mastra/run.ts`](../examples/mastra/run.ts) | `Agent`、`createTool`による実行。Vertex接続にはAI SDKのproviderを利用 |
| LangGraph | [`examples/langgraph/run.ts`](../examples/langgraph/run.ts) | `StateGraph`によるモデル・ツールノードと条件分岐 |
| LlamaIndex | [`examples/llamaindex/run.ts`](../examples/llamaindex/run.ts) | 文書化、分割、ベクトル索引、上位3チャンクの検索。Embeddingと回答生成にはGoogle Gen AI SDKを接続 |
| LangChain | [`examples/langchain/run.ts`](../examples/langchain/run.ts) | `createAgent`の標準ループ。内部でLangGraphを使用 |

共有するものは、架空の店舗記事、記事の参照範囲、検索・取得関数、回答指示、Vertex AIの設定。
LlamaIndex以外はキーワード検索→本文取得をモデルが選択する。最大6回を目安にモデルの往復を制限する。
LangChainはグラフの再帰回数で制限し、モデル呼び出し数の厳密な6回制限ではない。
LlamaIndexは選択記事を256トークン・重なり32で分割し、毎回メモリ内に索引を作り、質問をEmbeddingして検索後に回答を1回生成する。
Embeddingモデルは`GOOGLE_VERTEX_EMBEDDING_MODEL`で指定する。
索引はリクエスト単位で、異なる参照範囲の索引を再利用しない。Embedding設定は`Settings.withEmbedModel`で実行単位に分離する。

## 比較時の確認

| 質問・設定 | 確認すること |
| --- | --- |
| 送料はいくらですか？ | 500円、送料無料の条件、配送ガイドの参照 |
| 返品の条件と申請方法を教えて | 返品ガイドとサポート窓口の取得、条件と申請方法 |
| 海外配送はできますか？ | 記事に情報がないと回答する |
| サポート窓口だけ選択して送料を質問 | 選択外の配送ガイドを取得しない |

各実装で同じモデルと参照範囲を使う。処理手順・検索方式・初回ロードが異なるため、画面の時間はベンチマークには使わない。
表示する「取得した記事」はモデルへ渡した記事であり、回答の正しさを保証するものではない。
停止・55秒のタイムアウトは実行先へ中断を伝える。プロバイダー側の即時停止や課金停止は保証しない。

## 検証

```sh
npm test
npm run typecheck
npm run build
# Turbopackの内部ポートを制限する環境ではWebpackで確認する
npm run build -- --webpack
npm run lab:smoke
# Vertex AIへ各実装で1問ずつ実際に送る。利用料金が発生する。
npm run lab:smoke -- --live
# 特定の実装だけ確認する
npm run lab:smoke -- --live google llamaindex
```

実接続の結果はGit管理対象外の`eval-results/lab-smoke-*.json`へ記録する。
smokeは送料の数値と配送記事の取得を確認する疎通テストであり、品質全般の評価には上記ケースの確認も行う。
APIはローカル開発用。公開する場合はアプリの認証、利用者ごとの認可・利用制限、永続化・監視を追加する。

## 確認結果（2026-10-24）

- 自動テスト25件、型チェック、差分チェックが成功。モデルはモックに置き換え、7種類それぞれの実ランタイムでツールまたは検索を確認。
- 設定済みのVertex AIで、7種類すべての送料質問が成功。数値500と配送記事の取得を確認。
- Webpackの本番ビルドが成功し、本番サーバーの`/api/lab`でも7種類すべてHTTP 200で同じ確認を通過。
- 比較画面でGoogle版の回答・参照記事・履歴、実装切り替え、参照記事0件での送信禁止を確認。
- `npm audit`は脆弱性0件。SDKの間接依存のuuid・PostCSSを`overrides`で修正版に統一。
- この環境のTurbopackビルドはCSS処理の内部ポート作成制限で停止する。WebpackビルドにはLangChainの動的importに関する警告が残る。

## 公式資料

- [Google Gen AI SDK](https://github.com/googleapis/js-genai)
- [AI SDK](https://ai-sdk.dev/docs/introduction)
- [ADK](https://adk.dev/)
- [Mastra](https://mastra.ai/docs)
- [LangGraph](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [LlamaIndex.TS](https://developers.llamaindex.ai/typescript/framework/)
- [LangChain](https://docs.langchain.com/oss/javascript/langchain/overview)
