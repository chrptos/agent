# LangGraph

モデルとツールの処理をグラフとして定義する店舗記事アシスタントです。

## 読むところ

- [`run.ts`](run.ts): メッセージと呼び出し回数を保持するState、`model`・`tools`ノード、条件付きの辺。
- [`../shared/langchain.ts`](../shared/langchain.ts): ChatVertexAIとツールの共通定義。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「LangGraph」を選びます。
「返品の条件と申請方法を教えて」と質問し、履歴の`modelNode`と検索・本文取得の往復を確認します。
コードでは、モデルがツールを要求した場合と回答した場合で遷移先が変わるところを確認します。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live langgraph
```
