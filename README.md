# obsidian-various-complements-plugin

This plugin for [Obsidian] enables you to complement input in markdown files.

## Features

### Auto Complete

It complements the text with tokens that exists in a current file.

#### Commands

| Name          | Default Shortcut Key |
| ------------- | -------------------- |
| Auto Complete | `Ctrl + Space`       |

#### Support languages

- English
- Japanese

I would like to add any other languages if anyone needs them.😉

#### Demo

![Basic demo](https://raw.githubusercontent.com/tadashi-aikawa/obsidian-various-complements-plugin/main/demo/demo.gif)


## Settings

Add settings if needed in the future.


## For Developers

### Todo

- [ ] [Use WebWorker to improve performance](https://github.com/obsidianmd/obsidian-releases/pull/155#issuecomment-774930410)

### Build

```
npm run dev
```

or

```
npm run build
```

### Release

```
make release version=x.y.z
```

[Obsidian]: https://obsidian.md/
