# Gemini ADK (Python) ハンズオン

Google ADK(Agent Development Kit, Python版)で、文章要約機能を試すハンズオンです。
ツールを持たない単一の`Agent`に要約指示を与え、`Runner`経由で実行します。

## 読むところ

- [`config.py`](config.py): `.env`の読み込みと、Gemini Enterprise Agent Platform(旧Vertex AI)をバックエンドに使うための環境変数設定。
- [`summarize.py`](summarize.py): `Agent`・`InMemorySessionService`・`Runner`の組み立てと、`run_async`のイベントから最終応答を取り出す処理。

## セットアップ

```sh
cd gemini-adk
uv sync
cp .env.example .env
# .env の GOOGLE_CLOUD_PROJECT を自分のプロジェクトIDに書き換える
```

## 試し方

サンプル文章を要約する場合:

```sh
uv run python summarize.py
```

任意のテキストを渡す場合:

```sh
uv run python summarize.py "ここに要約したい文章を入れる"
```

実行するとVertex AI(Gemini Enterprise Agent Platform)の利用料金が発生します。
