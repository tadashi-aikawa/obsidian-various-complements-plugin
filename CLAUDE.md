# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Various Complements**, an Obsidian plugin that provides IDE-like auto-completion functionality. The plugin enables word completion from multiple sources including current file, vault-wide search, custom dictionaries, internal links, and front matter.

## Development Commands

```bash
# Development with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Pre-push validation (type check + tests)
pnpm pre:push

# Full CI pipeline
pnpm ci
```

## Technology Stack

- **Language**: TypeScript (ES2018, strict mode)
- **Package Manager**: pnpm v10.1.0+
- **Build Tool**: esbuild with custom configuration
- **UI Framework**: Svelte v4.2.18 for components
- **Testing**: Jest with esbuild-jest transformer
- **Obsidian API**: v0.16.0
- **Node.js**: v22

## Architecture Overview

### Core Architecture Patterns

**Provider Pattern**: Multiple word providers handle different completion sources:
- `CurrentFileWordProvider` - words from current file
- `CurrentVaultWordProvider` - words from entire vault
- `CustomDictionaryWordProvider` - user-defined dictionaries
- `InternalLinkWordProvider` - Obsidian internal links
- `FrontMatterWordProvider` - YAML front matter keys/values

**Strategy Pattern**: Configurable strategies for:
- Tokenization (language-specific: English, Japanese, Chinese, Arabic)
- Matching algorithms (fuzzy, exact, prefix)

**Plugin Architecture**: Extends Obsidian's `Plugin` class with modular components for UI, settings, and core functionality.

### Key Source Directories

- `src/provider/` - Word suggestion providers and core suggestion logic
- `src/tokenizer/` - Text tokenization with language-specific implementations
- `src/ui/` - Obsidian UI components and Svelte components
- `src/setting/` - Plugin settings management
- `src/util/` - Utility functions and helpers
- `src/model/` - TypeScript type definitions

### Entry Points

- `src/main.ts` - Plugin entry point and main class
- `src/app-helper.ts` - Obsidian app utilities and wrappers

## Testing

Tests are co-located with source files using `.test.ts` suffix. Key test areas:
- Tokenizer implementations (`src/tokenizer/tokenizers/`)
- Utility functions (`src/util/`)
- Core logic validation

## Cross-Platform Considerations

This plugin must work on Windows, macOS, and Linux. Pay special attention to:
- Path handling (use `src/util/path.ts` utilities)
- File system operations
- macOS/Safari-specific compatibility issues

## Language and Communication

- Respond in Japanese when communicating with users
- Technical reasoning and code comments can be in English
- This is specified in `.github/copilot-instructions.md`

## Git Commit Guidelines

When creating commits, follow the **Conventional Commit** format enforced by `hooks/commit-msg`:

```
<type>(<scope>): <description>
```

### Commit Types
- `feat` - New features
- `fix` - Bug fixes  
- `style` - Code style changes
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `test` - Test additions/modifications
- `ci` - CI/CD changes
- `build` - Build system changes
- `dev` - Development environment changes
- `chore` - Maintenance tasks

### Commit Scopes (optional)
- `current file` - Current file provider
- `current vault` - Current vault provider
- `custom dictionary` - Custom dictionary provider
- `internal link` - Internal link provider
- `front matter` - Front matter provider

**Note**: Multiple scopes can be specified using `/` as delimiter (e.g., `current file/custom dictionary`)

### Examples
```bash
feat(custom dictionary): Add provider-specific trigger settings
fix(internal link): Resolve path resolution issue
feat(current file/current vault): Add per-provider minimum character settings
docs: Update README with new configuration options
```

## Provider-Specific Settings

The plugin supports **provider-specific trigger settings** for fine-grained control:

### Trigger Character Settings
Each provider can have independent minimum character requirements:
- `currentFileMinNumberOfCharactersForTrigger` - Current file provider
- `currentVaultMinNumberOfCharactersForTrigger` - Current vault provider  
- `customDictionaryMinNumberOfCharactersForTrigger` - Custom dictionary provider
- `internalLinkMinNumberOfCharactersForTrigger` - Internal link provider

**Behavior:**
- Set to `0` to use global `minNumberOfCharactersTriggered` setting
- Set to `1-10` to override with provider-specific minimum
- The system respects the lowest minimum among all enabled providers for trigger activation
- Individual providers are filtered based on their specific settings

### Implementation Details
- **Global trigger logic**: `AutoCompleteSuggest.minNumberTriggered` getter considers all provider minimums
- **Provider filtering**: `suggester.ts` functions respect individual provider thresholds
- **Settings UI**: Each provider section includes trigger configuration sliders

## Important Implementation Notes

- The plugin uses a custom fork of `chinese-tokenizer` for Chinese text processing
- Svelte components are in `src/ui/component/` and follow Obsidian's styling patterns
- Settings are managed through `src/setting/settings.ts` with helper functions
- Word indexing is real-time with status indicators in the status bar
- Performance is critical - efficient tokenization and caching are essential