# LangChain

モデルと店舗記事の検索ツールを`createAgent`に渡すサンプルです。

## 読むところ

- [`run.ts`](run.ts): `createAgent`への設定と`invoke`による実行。
- [`../shared/langchain.ts`](../shared/langchain.ts): ChatVertexAIとZodスキーマを使ったツール。
- [`../langgraph/run.ts`](../langgraph/run.ts): グラフを直接定義する実装との比較。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「LangChain」を選びます。
「返品の条件と申請方法を教えて」と質問し、エージェントが検索・本文取得を選び、取得内容から回答する流れを確認します。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live langchain
```
