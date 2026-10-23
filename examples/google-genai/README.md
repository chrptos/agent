# Google Gen AI SDK

店舗記事を検索し、本文を取得して回答する処理を、GoogleのSDKで直接組み立てるサンプルです。

## 読むところ

- [`run.ts`](run.ts): `generateContent` → 関数呼び出しの判定 → ツール実行 → 結果をモデルへ返すループ。
- [`../shared/google-client.ts`](../shared/google-client.ts): Vertex AIの接続設定。

## 試し方

ルートで`npm run dev`を実行し、`/lab`で「Google Gen AI SDK」を選びます。
「返品の条件と申請方法を教えて」と質問し、検索・複数記事の本文取得・回答の順序を確認します。

実接続の疎通確認はルートで実行します。Vertex AIの利用料金が発生します。

```sh
npm run lab:smoke -- --live google
```
