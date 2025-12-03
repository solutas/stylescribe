---
title: Example Design System
slug: index
---

# Example Design System

Welcome to the Stylescribe Example Design System. This demonstrates the key features of stylescribe.

## Getting Started

Browse components using the sidebar, or use the links below:

### Components by Category

**Interactive**
- [Button](./components/button.html) - Clickable buttons with multiple styles

**Feedback**
- [Alert](./components/alert.html) - Contextual feedback messages

**Layout**
- [Card](./components/card.html) - Content containers

## Design Tokens

This design system uses CSS custom properties (design tokens) for consistent styling:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #0d6efd | Primary brand color |
| `--spacing-md` | 16px | Standard spacing |
| `--border-radius-md` | 8px | Default border radius |

## Features

### Interactive Playground

Each component page includes an **Interactive Playground** where you can:

1. Switch between variations
2. Toggle modifiers
3. Show/hide elements
4. Preview at different screen sizes
5. Copy generated code

### Design Tokens CLI

Extract and manage tokens from the command line:

```bash
stylescribe tokens extract -i ./sass/base.css -o ./tokens.json
stylescribe tokens export -i ./tokens.json -f scss
```

## Contributing

1. Create components in `sass/components/`
2. Add JSDoc annotations
3. Run `stylescribe dev` to preview
4. Submit a PR!
