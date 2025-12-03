---
title: Getting Started
navtitle: Getting Started
order: 1
---

Welcome to the Design System documentation! This guide will help you get started with using our components and design tokens in your project.

## Installation

Install the design system package in your project:

```bash
npm install @example/design-system
```

## Basic Setup

### 1. Import the Styles

Add the design system styles to your project:

```css
/* In your main CSS file */
@import '@example/design-system/css/base.css';
@import '@example/design-system/css/components.css';
```

Or import individual components:

```scss
// In your SCSS file
@import '@example/design-system/sass/components/button/button';
@import '@example/design-system/sass/components/card/card';
```

### 2. Use Design Tokens

All design tokens are available as CSS custom properties:

```css
.my-custom-element {
    color: var(--color-text);
    background: var(--color-surface);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-md);
}
```

### 3. Add Components

Use the component classes in your HTML:

```html
<button class="btn btn--primary">
    Get Started
</button>

<div class="card">
    <div class="card__body">
        <h3 class="card__title">Welcome</h3>
        <p class="card__text">Your content here.</p>
    </div>
</div>
```

## File Structure

When working with the design system, we recommend this structure:

```
your-project/
├── src/
│   ├── styles/
│   │   ├── main.scss          # Main entry point
│   │   ├── _variables.scss    # Your custom tokens
│   │   └── _overrides.scss    # Component overrides
│   └── ...
└── package.json
```

## Customization

Override design tokens by defining your own CSS custom properties:

```css
:root {
    /* Override the primary color */
    --color-primary: #your-brand-color;

    /* Adjust spacing scale */
    --spacing-md: 20px;
}
```

## Browser Support

The design system supports all modern browsers:

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Next Steps

- Browse the [Components](/components) to see available UI elements
- Review the [Design Tokens](/tokens) for styling values
- Read the [Guidelines](/guidelines) for best practices
