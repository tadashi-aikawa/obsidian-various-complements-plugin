# Release Guide

本リポジトリのリリース手順と補助スクリプトの使い方です。実行は手動で行ってください。

## 前提

- GitHub CLI が認証済みで利用可能であること（`gh auth status`）
- デフォルトブランチ上で作業していること（通常は `main`）

## 手順（順序付き）

1. ローカルの未push確認: `git status` で未コミットが無いことを確認し、`git fetch` 後に `HEAD` が upstream に対して ahead でないことを確認（ahead なら `git push`）。
2. CI成功の確認: GitHub Actions の Tests ワークフロー（`.github/workflows/tests.yaml`）が最新コミットで成功していることを確認（必要なら `gh run list --workflow tests.yaml --limit 1` 等で確認）。
3. リリース実行: GitHub Actions の Release ワークフロー（`.github/workflows/release.yaml`）を `workflow_dispatch` で手動実行（UI から or `gh workflow run release.yaml --ref <branch>`）。このリポジトリは semantic‑release によりバージョン決定とリリース作成が自動化されます。
4. リリース完了確認: Actions の Release ジョブ成功を待ち、GitHub の Releases ページで新しいリリース（タグとリリースノート）が作成されたことを確認。
5. 関連Issue対応: コミットメッセージで参照された `#番号` の Issue に「リリースした旨」をコメントして Close。コメント例: `Released in vX.Y.Z <URL> 🚀`（必要に応じて投稿者へメンション）。
6. Bluesky投稿準備: プロダクト名・バージョン・主要変更点（箇条書き）・リリースURLで文面を整え、手動で投稿。
7. リポジトリ最新化: semantic‑release が push した `chore(release): x.y.z` を取り込むため `git pull`。

## 補助コマンド

`pnpm release` で以下を順に実施します（非破壊チェック＋自動実行）。

- ローカルの未コミット/未push確認
- Tests ワークフローの最新結果確認
- Release ワークフローの手動トリガー（`workflow_dispatch`）
- Release 実行のウォッチと最新リリース情報の取得
- Issue コメント/Bluesky 投稿用テンプレートの出力
- `git pull` によるローカルの最新化

実際の投稿や Issue コメントは出力をコピーして手動で行ってください。

