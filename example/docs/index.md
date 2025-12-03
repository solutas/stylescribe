---
title: Example Design System
slug: index
---

# Example Design System

Welcome to the Stylescribe Example Design System. This demonstrates the key features of stylescribe.

## Documentation

<div class="row g-4 mb-5">
<div class="col-md-6 col-lg-3">
<div class="card h-100">
<div class="card-body">
<h3 class="h5">📖 Getting Started</h3>
<p class="card-text">Learn how to install and use the design system in your project.</p>
<a href="./getting-started.html" class="stretched-link"></a>
</div>
</div>
</div>
<div class="col-md-6 col-lg-3">
<div class="card h-100">
<div class="card-body">
<h3 class="h5">🎨 Design Tokens</h3>
<p class="card-text">Visual reference for colors, spacing, typography, and more.</p>
<a href="./tokens.html" class="stretched-link"></a>
</div>
</div>
</div>
<div class="col-md-6 col-lg-3">
<div class="card h-100">
<div class="card-body">
<h3 class="h5">📐 Guidelines</h3>
<p class="card-text">Best practices and naming conventions for using the system.</p>
<a href="./guidelines.html" class="stretched-link"></a>
</div>
</div>
</div>
<div class="col-md-6 col-lg-3">
<div class="card h-100">
<div class="card-body">
<h3 class="h5">♿ Accessibility</h3>
<p class="card-text">Guidelines for building inclusive, accessible interfaces.</p>
<a href="./accessibility.html" class="stretched-link"></a>
</div>
</div>
</div>
</div>

## Components

Browse our component library:

### Interactive
- [Button](./components/button.html) - Clickable buttons with multiple styles

### Feedback
- [Alert](./components/alert.html) - Contextual feedback messages

### Layout
- [Card](./components/card.html) - Content containers

## Features

### Interactive Playground

Each component page includes an **Interactive Playground** where you can:

1. Switch between variations
2. Toggle modifiers
3. Show/hide elements
4. Preview at different screen sizes
5. Copy generated code

### Design Tokens

This design system uses **W3C Design Tokens** format. View all tokens on the [Design Tokens page](./tokens.html), or use the CLI:

```bash
# Extract tokens from CSS
stylescribe tokens extract -i ./sass/base.css -o ./tokens.json

# Export to different formats
stylescribe tokens export -i ./tokens.json -f scss
stylescribe tokens export -i ./tokens.json -f css
```

### Quick Token Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #0d6efd | Primary brand color |
| `--spacing-md` | 16px | Standard spacing |
| `--border-radius-md` | 8px | Default border radius |

[View all tokens →](./tokens.html)

## Contributing

1. Create components in `sass/components/`
2. Add JSDoc annotations
3. Run `stylescribe dev` to preview
4. Submit a PR!
