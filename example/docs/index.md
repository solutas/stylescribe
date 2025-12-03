---
title: Example Design System
slug: index
---

Welcome to the Stylescribe Example Design System. This demonstrates the key features of stylescribe including design tokens, component documentation, and interactive playgrounds.

## Quick Links

<div class="row g-4 mb-4">
<div class="col-md-6 col-lg-3">
<div class="card h-100 border-primary">
<div class="card-body">
<h3 class="h5 text-primary">Getting Started</h3>
<p class="card-text small">Installation and setup guide for using the design system.</p>
<a href="./getting-started.html" class="stretched-link"></a>
</div>
</div>
</div>
<div class="col-md-6 col-lg-3">
<div class="card h-100 border-success">
<div class="card-body">
<h3 class="h5 text-success">Design Tokens</h3>
<p class="card-text small">Visual reference for colors, spacing, typography tokens.</p>
<a href="./tokens.html" class="stretched-link"></a>
</div>
</div>
</div>
<div class="col-md-6 col-lg-3">
<div class="card h-100 border-info">
<div class="card-body">
<h3 class="h5 text-info">Guidelines</h3>
<p class="card-text small">Best practices and naming conventions.</p>
<a href="./guidelines.html" class="stretched-link"></a>
</div>
</div>
</div>
<div class="col-md-6 col-lg-3">
<div class="card h-100 border-warning">
<div class="card-body">
<h3 class="h5 text-warning">Accessibility</h3>
<p class="card-text small">WCAG guidelines and accessible patterns.</p>
<a href="./accessibility.html" class="stretched-link"></a>
</div>
</div>
</div>
</div>

## Features

### Interactive Playground

Each component page includes an **Interactive Playground** where you can:

- Switch between style variations
- Toggle size modifiers
- Show/hide optional elements
- Preview at different screen sizes
- Copy generated HTML code

### W3C Design Tokens

This design system uses the **W3C Design Tokens Community Group** format for all design tokens. Export tokens to CSS, SCSS, or Style Dictionary formats.

```bash
# Extract tokens from existing CSS
stylescribe tokens extract -i ./sass/base.css -o ./tokens.json

# Export to different formats
stylescribe tokens export -i ./tokens.json -f scss
```
