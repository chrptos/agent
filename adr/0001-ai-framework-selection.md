# ADR 0001: AI SDK・フレームワークの選定指針

- 日付: 2026-10-28
- 状態: 選定指針として記録

## 背景

プロダクトにAI機能を実装する際、各SDK・フレームワークに何を任せたいかによって選択する。
このリポジトリで扱う7種類の候補を、主目的に沿ってYes／Noで絞れるようにする。

## 決定

以下の分岐を候補選定の目安として使う。複数の条件に当てはまる場合は、組み合わせて利用することも検討する。
各ツールの担当範囲は重なっているため、分岐は得意分野を基にした選定指針とする。

```mermaid
flowchart TD
    A{"文書の取り込み・分割・索引・検索が<br/>機能の中心？"}
    A -->|Yes| LI["LlamaIndex<br/>例：商品マニュアルの質問応答"]
    A -->|No| B{"Webの会話UIやストリーミングとの<br/>接続を簡単にしたい？"}

    B -->|Yes| AI["Vercel AI SDK<br/>例：お買い物相談チャット"]
    B -->|No| C{"主にGeminiを直接呼び、<br/>生成・抽出・分類などを行いたい？"}

    C -->|Yes| G["Google Gen AI SDK<br/>例：商品画像から出品情報を生成"]
    C -->|No| D{"複雑な条件分岐・承認待ち・中断再開を<br/>明示的に設計したい？"}

    D -->|Yes| LG["LangGraph<br/>例：承認付きの返品・返金受付"]
    D -->|No| E{"Googleのエージェント開発基盤で<br/>セッションや複数エージェントを扱いたい？"}

    E -->|Yes| ADK["Google ADK<br/>例：売上・在庫の調査アシスタント"]
    E -->|No| F{"TypeScriptでワークフロー・記憶・評価を<br/>まとめて整えたい？"}

    F -->|Yes| M["Mastra<br/>例：商品説明の制作・評価・改善"]
    F -->|No| LC["LangChainを検討<br/>例：検索や注文取得ツールを使う問い合わせ対応"]
```

図中の題材は使いどころの例。現在のサンプルの機能は[サンプル一覧](../examples/README.md)と[比較アプリのガイド](../docs/framework-lab.md)を参照する。

## 適用方法

- 会話画面はAI SDK、文書検索はLlamaIndexのように、異なる担当範囲を組み合わせる。
- Vertex AIなどのモデル提供基盤は、この図のSDK・フレームワーク選定と分けて考える。
- 最後のLangChainへの分岐も候補として扱い、必要なツール連携や実行制御が合うかを確認する。

## 公式資料

- [LlamaIndex](https://developers.llamaindex.ai/typescript/framework/)
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction)
- [Google Gen AI SDK](https://github.com/googleapis/js-genai)
- [LangChain / LangGraph](https://www.langchain.com/oss-overview)
- [Google ADK](https://adk.dev/)
- [Mastra](https://mastra.ai/docs)
