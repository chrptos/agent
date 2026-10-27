# LlamaIndex

店舗記事を分割してベクトル索引を作り、質問に関連する本文から回答するRAGサンプルです。

## 読むところ

- [`run.ts`](run.ts): `Document` → `SentenceSplitter` → `VectorStoreIndex` → 検索 → 回答生成。
- `VertexEmbedding`: Google Gen AI SDKをLlamaIndexのEmbeddingとして使う接続部分。
- `Settings.withEmbedModel`: リクエストごとのEmbedding設定の分離。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「LlamaIndex」を選びます。
参照記事を選んで質問し、`splitDocuments`・`buildVectorIndex`・`retrieve`と、取得された本文・類似度を確認します。
Embeddingモデルは`.env.local`の`GOOGLE_VERTEX_EMBEDDING_MODEL`で設定します。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live llamaindex
```
