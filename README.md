# obsidian-various-complements-plugin

[![release](https://img.shields.io/github/release/tadashi-aikawa/obsidian-various-complements-plugin.svg)](https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/releases/latest)
![downloads](https://img.shields.io/github/downloads/tadashi-aikawa/obsidian-various-complements-plugin/total)

This plugin for [Obsidian] enables you to complement input in markdown files.

## ⌨️Features

### Auto Complete

It complements the text with tokens that exists in a current file.

#### Commands

| Name                      | Default Shortcut Key | Support Languages                         |
| ------------------------- | -------------------- | ----------------------------------------- |
| Auto Complete             | `Ctrl + Space`       | Languages whose word break is whitespace  |
| Auto Complete as Arabic   |                      | Arabic (Trim `،؛` in addition to default) |
| Auto Complete as Japanese |                      | Japanese                                  |

I would like to add any other languages if anyone needs them.😉

#### Demo

##### Auto Complete

![Basic demo](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/demo2.gif)

##### Auto Complete as Japanese

![Basic demo japanese](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/demo.gif)


## 🖥️ For developers

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
