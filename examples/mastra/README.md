# Mastra

店舗記事の検索・本文取得を`createTool`で定義し、`Agent`に組み込むサンプルです。

## 読むところ

- [`run.ts`](run.ts): Zodスキーマを持つツール、Agentの指示、最大ステップ数。
- Vertex AIへの接続には`@ai-sdk/google-vertex`のモデルを渡しています。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「Mastra」を選びます。
「返品の条件と申請方法を教えて」と質問し、Agentが型付きツールを呼び出して回答する流れを確認します。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live mastra
```
