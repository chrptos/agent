# Google ADK

店舗記事の検索ツールを`LlmAgent`に渡し、`InMemoryRunner`で実行するサンプルです。

## 読むところ

- [`run.ts`](run.ts): `Gemini`、`FunctionTool`、`LlmAgent`の組み立てとRunnerのセッション作成。
- `runner.runAsync`: 実行イベントを受け取り、`isFinalResponse`で最終回答を取り出す処理。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「Google ADK」を選びます。
「返品の条件と申請方法を教えて」と質問し、Runner経由で検索と本文取得が進むことを確認します。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live adk
```
