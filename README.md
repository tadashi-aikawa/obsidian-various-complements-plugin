# obsidian-various-complements-plugin

[![release](https://img.shields.io/github/release/tadashi-aikawa/obsidian-various-complements-plugin.svg)](https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/releases/latest)
![downloads](https://img.shields.io/github/downloads/tadashi-aikawa/obsidian-various-complements-plugin/total)

This plugin for [Obsidian] enables you to complement input in markdown files.

## ⌨️Features

### Auto Complete

It complements the text with tokens that exists in a current file.

You can set a strategy if the separator of your language is not only whitespace.

![settings](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/settings.png)

### Demo

#### Default

![default](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/default.gif)

#### Japanese

![default](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/japanese.gif)

## 👁 Live preview support

It supports Live Preview mode for now.

![default](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/livepreview.gif)

## 📱 Mobile support

It supports on mobile.

![default](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/mobile.gif)

## 🖥️ For developers
~~~~
- Requirements
    - [Task]

### Todo

- [ ] [Use WebWorker to improve performance](https://github.com/obsidianmd/obsidian-releases/pull/155#issuecomment-774930410)

### Development

```console
task init
task dev
```

### Release

```
task release VERSION=1.2.3
```

[Obsidian]: https://obsidian.md/
[Task]: https://github.com/go-task/task
