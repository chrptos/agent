# Contributing

## 開発の流れ

1. Issueで目的・作業範囲・完了条件を整理する。
2. 最新の`develop`から`feature/<変更内容>`を作成する。
3. 実装し、変更に応じた検証を行う。
4. `develop`向けにPRを作成し、レビュー後にマージする。
5. 関連Issueの完了条件を確認し、完了したものを閉じる。

セットアップは[README](README.md#起動)を参照する。

## ブランチ

Git Flowを使用する。ブランチ名に`codex/`は付けない。

| ブランチ | 用途 | 分岐元 | マージ先 |
| --- | --- | --- | --- |
| `main` | リリース済みコード | — | — |
| `develop` | 次のリリースに向けた統合 | `main` | — |
| `feature/*` | 機能追加・改善・ドキュメント変更 | `develop` | `develop` |
| `release/*` | リリース準備 | `develop` | `main`と`develop` |
| `hotfix/*` | リリース済みコードの緊急修正 | `main` | `main`と`develop` |

`main`・`develop`へ直接機能を実装しない。マージ済みの作業ブランチは再利用せず、新しいブランチを作る。リリース時は`main`にタグを付ける。

```sh
git fetch origin
git switch develop
git merge --ff-only origin/develop
git switch -c feature/short-description
```

## Issue

[Issue #1](https://github.com/chrptos/agent/issues/1)と[Issue #3](https://github.com/chrptos/agent/issues/3)の形式に合わせる。

- `Why`: 目的や解決したい問題。
- `What`: 実施すること。実行・確認する項目はチェックリストにする。
- `完了条件`: 何を確認できれば完了か。必要に応じて記載する。
- `Other`: 制約や補足。
- `Refs`: 関連Issue・PR・資料。

未決定の内容は決定事項として書かない。後で行う作業は別Issueに分け、関連をリンクする。

## コミットとPR

コミットは変更の目的が分かる単位にまとめ、`feat: ...`や`docs: ...`のように種類と変更内容を記載する。

[PR #2](https://github.com/chrptos/agent/pull/2)を参考に、以下の形式で簡潔に記載する。該当する内容がない項目は省略できる。

- `Issue`: 対応するIssue。
- `What?`: 変更後にできること。
- `Why?`: 変更の目的。
- `How?`: 実装方法の要点。
- `Decisions`: 合意した判断。発言者を付けた引用で記載する。
- `Evidence`: UIや動作の確認結果、必要な比較や画像。
- `Other`: テスト結果、未確認事項、制約。
- `Refs`: 関連資料。

`develop`へのマージ後もIssueが開いている場合は、完了条件を確認して閉じる。

## 検証

コード変更では、変更内容に応じて以下を実行し、PRに結果を記載する。

```sh
npm test
npm run typecheck
npm run build
git diff --check
```

UI変更では画面も確認する。ドキュメントのみの変更では、内容・リンク・差分を確認する。
モックでの自動テストと実際のVertex AIへの接続確認は区別し、未確認の動作を確認済みと書かない。

## 公開情報の扱い

コード、ドキュメント、Issue、PR、ログ、スクリーンショットに個人情報・秘密情報を含めない。サンプルには架空のデータを使う。
認証情報や実際のプロジェクトIDはローカルの環境設定で管理し、コミットしない。`.env.example`にはダミー値のみを記載する。
