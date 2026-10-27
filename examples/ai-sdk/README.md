# Vercel AI SDK

店舗記事の検索・本文取得を`ToolLoopAgent`に渡すサンプルです。

## 読むところ

- [`run.ts`](run.ts): モデル、指示、`tool`の定義と`stepCountIs`による停止条件。
- [`../../app/page.tsx`](../../app/page.tsx): ストリーミングと本文取得の承認を扱う既存のチャット画面。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「Vercel AI SDK」を選びます。
「送料はいくらですか？」と質問し、ツールの結果から回答を作る流れを確認します。
`/`では、本文取得を承認・拒否した場合の会話も試せます。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live ai-sdk
```
