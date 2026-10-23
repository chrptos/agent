# Agent Lab

AI SDKとVertex AIで、エージェントのループ・ツール設計・確認用UIを試すMVPです。公開用の架空の店舗記事だけを扱います。

開発手順・Issue/PRの書き方は[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## 7種類の実装を比較する

起動後に <http://localhost:3000/lab> を開くと、Google Gen AI SDK、Vercel AI SDK、Google ADK、Mastra、LangGraph、LlamaIndex、LangChainで同じ店舗記事に質問できます。回答・取得した記事・実行履歴を実装ごとに確認できます。
セットアップと実装の違い、検証方法は[比較アプリのガイド](docs/framework-lab.md)を参照してください。
各実装は[`examples/`](examples/README.md)のSDK別ディレクトリにあり、それぞれのREADMEから実装と試し方を確認できます。

## 起動

Node.js 22以上、npm、Google Cloud CLIを使用します。

```sh
npm ci
cp .env.example .env.local
gcloud auth application-default login
npm run dev
```

`.env.local` の `GOOGLE_VERTEX_PROJECT` を自分のプロジェクトIDに変更します。対象プロジェクトで課金とVertex AI APIを有効にし、実行ユーザーにVertex AIを呼び出せる権限を設定してください。必要な環境では `gcloud auth application-default set-quota-project YOUR_PROJECT_ID` も実行します。
`GOOGLE_VERTEX_LOCATION` と `GOOGLE_VERTEX_MODEL` は利用可能なリージョン・モデルに合わせて変更できます。
ブラウザで <http://localhost:3000> を開きます。

認証はサーバー側のApplication Default Credentialsを使います。認証ファイルをリポジトリへコピーする必要はありません。`.env.local` はGit管理対象外です。認証情報、実データ、個人情報はコミットしないでください。

## 試すこと

| 質問例 | 確認する動き |
| --- | --- |
| 送料はいくらですか？ | 検索 → 本文取得 → 根拠付き回答 |
| 返品の条件と申請方法を教えて | 返品記事と参照先のサポート記事を取得して回答 |
| 海外配送はできますか？ | 記事に情報がないことを伝える |

入力欄の「参照する記事」で、使うサンプル記事を選択できます。検索・本文取得は選択した記事だけが対象です。初期状態は全記事が選択されています。1件以上選択してください。本文も選択画面から確認できます。
参照先は会話中に固定されます。変更するには「新しい会話」を押してください。以前取得した情報が別の参照範囲の回答に混ざることを避けるためです。

検索・本文取得の状況はチャット内に実行順で表示されます。各表示を開くとツール名・引数・結果・ステップ番号を確認できます。モデルの判断によって実行経路は変わります。検索語を変えた追加検索も確認できます。

1回のAPIリクエストは最大6生成ステップです。承認後の再開は別リクエストになり、上限はリセットされます。並列のツール呼び出しは同じステップに含まれます。上限に達すると最終回答の生成前でも終了します。
停止ボタンはクライアントの受信を中断します。サーバーは切断通知と55秒のタイムアウトをモデル処理へ伝えますが、プロバイダー側の即時停止・課金停止は保証しません。
会話は画面内のメモリだけに保持し、リセット・ページ再読み込みで消えます。

## ツール実行の承認

検索は自動実行し、本文取得の直前に承認を求めます。対象記事と引数を確認して「承認して実行」か「拒否」を選んでください。承認された取得だけを実行して本文をAIに渡します。複数の取得が同時に要求された場合は、すべてに回答した後に再開します。拒否した取得は実行せず、その結果をAIへ渡します。

承認待ちでは質問の送信を止めます。「新しい会話」で依頼を破棄できます。再開に失敗した場合は設定を確認し、「再試行」で現在の会話を再送できます。再読み込みすると承認待ちも失われます。承認はローカルMVPの操作確認用であり、認証に基づく権限制御の代わりにはなりません。

## 構成

- `lib/agent.ts`: Vertex AIとエージェントの組み立て
- `lib/agent-config.ts`: 指示と共通のステップ上限
- `lib/document-tools.ts`: 検索・本文取得ツールと参照範囲・承認の設定
- `lib/documents.ts`: 架空記事、キーワード検索、本文取得
- `app/api/chat/route.ts`: 入力検証とUIストリームのAPI
- `app/page.tsx`: 質問、回答、実行トレース、サンプル記事
- `app/components/`: 会話メッセージ、ツール実行・承認カード、参照記事選択の表示
- `components/ui/`: shadcn/uiの共通部品。会話・入力・実行履歴はAI Elementsの構成を使用
- `components.json`: shadcn CLIの設定。部品の追加は`npx shadcn@latest add <名前>`
- `app/style.css`: Tailwind CSSの読み込みと、shadcn標準のNeutralテーマ

検索はキーワードの部分一致です。ベクトル検索は使っていません。検索結果は概要だけを返し、本文は別のツールで取得します。外部ファイルや実際の社内データは読みません。回答はプレーンテキストで表示します。

## 検証

```sh
npm test
npm run typecheck
npm run build
```

自動テストは架空データの検索・取得と、実モデルを呼ばないループ検証を対象にします。実際のVertex AIの回答品質やツール選択は、認証を設定して上の3ケースで確認してください。

ローカル検証用のMVPです。認証付きの公開API、永続化、中断後の再開、運用監視は対象外です。

## エージェントの評価

固定の質問で、回答とツール利用を繰り返し確認できます。手順と判定の限界は[評価ガイド](evals/README.md)を参照してください。

```sh
# ケース一覧と実行方法を表示（API呼び出しなし）
npm run eval

# Vertex AIで4ケースを順番に実行（利用料金が発生）
npm run eval -- --live
```

結果はGit管理対象外の`eval-results/`にJSONで保存します。

参考: [Agents](https://ai-sdk.dev/docs/agents/overview) / [Vertex AI provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)
