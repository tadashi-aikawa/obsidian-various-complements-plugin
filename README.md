# obsidian-various-complements-plugin

[![release](https://img.shields.io/github/release/tadashi-aikawa/obsidian-various-complements-plugin.svg)](https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/releases/latest)
[![Tests](https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/workflows/Tests/badge.svg)](https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/actions)
![downloads](https://img.shields.io/github/downloads/tadashi-aikawa/obsidian-various-complements-plugin/total)

This plugin for [Obsidian] enables you complete words like the auto-completion of IDE.

![](https://tadashi-aikawa.github.io/docs-obsidian-various-complements-plugin/resources/various-complements.gif)

## 📚 Documentation

https://tadashi-aikawa.github.io/docs-obsidian-various-complements-plugin/

## 👥 For users

### Feature requests / Bugs

Please create a new [issue].

### Questions / Others

Please create a new [discussion].

### Pull requests

Before creating a pull request, please make an [issue] or a [discussion]😉

[issue]: https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues
[discussion]: https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/discussions

## 🖥️ For developers

- Requirements
    - Node.js v22

### Development

#### 依存ライブラリインストール

```bash
corepack enable
pnpm install
```

#### 開発用ビルド

```bash
# 開発ビルド
pnpm dev
```

#### テスト

```bash
pnpm test
# ファイル変更時に再実行
pnpm test --watch
```

#### CI

```bash
# CIコマンド実行
pnpm run ci
```

#### Release

```bash
# Stable
VERSION=1.2.3 pnpm release

# Beta
VERSION=1.2.3-beta1 pnpm release
```

[Obsidian]: https://obsidian.md/

