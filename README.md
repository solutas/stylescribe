# Stylescribe

A modern, lightweight style guide generator for CSS/SCSS design systems with W3C Design Token support.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **CSS/SCSS Documentation** - Generate beautiful documentation from annotated stylesheets
- **Interactive Playground** - Toggle variations, modifiers, and elements in real-time
- **W3C Design Tokens** - Import/export tokens in DTCG format
- **Live Reload** - Hot-reload development server
- **Framework Agnostic** - Works with any CSS methodology (BEM, SUIT, etc.)
- **Customizable Templates** - Override Handlebars templates to match your brand

## Quick Start

```bash
# Install globally
npm install -g stylescribe

# Or locally in your project
npm install stylescribe --save-dev

# Start the dev server
stylescribe dev --source ./sass --build-target ./build
```

**Try the example:**
```bash
git clone https://github.com/solutas/stylescribe.git
cd stylescribe/example
npm install
npm run dev
# Open http://localhost:4142
```

## Documentation

- [Example Project](./example/) - Working example with sample components
- [Contributing Guide](./CONTRIBUTING.md) - How to develop locally and contribute

---

## Commands

### `stylescribe dev`

Start development server with live reload.

```bash
stylescribe dev --source ./sass --build-target ./build
```

| Option | Description | Default |
|--------|-------------|---------|
| `--source` | Source directory for CSS/SCSS | `./sass` |
| `--build-target` | Build output directory | `./build` |
| `--watch` | Watch for file changes | `true` |

### `stylescribe build`

Generate static CSS and annotation files.

```bash
stylescribe build --source ./sass --output ./build
```

### `stylescribe docs`

Generate complete static documentation site.

```bash
stylescribe docs --source ./sass --build-target ./build --output ./site
```

### `stylescribe tokens`

Manage W3C Design Tokens.

```bash
# Extract tokens from CSS/SCSS
stylescribe tokens extract -i ./src/variables.css -o ./tokens.json

# Export to CSS custom properties
stylescribe tokens export -i ./tokens.json -f css -o ./variables.css

# Export to SCSS variables
stylescribe tokens convert -i ./tokens.json -f scss -o ./_tokens.scss

# Validate token file
stylescribe tokens validate -i ./tokens.json

# Merge multiple token files
stylescribe tokens merge -i "./tokens/*.json" -o ./merged.json
```

### `stylescribe create-component`

Scaffold a new component.

```bash
stylescribe create-component button --source ./sass/components --group Interactive
```

### `stylescribe create-page`

Create a new documentation page.

```bash
stylescribe create-page getting-started --docs ./docs --title "Getting Started"
```

---

## Project Structure

```
your-project/
├── sass/
│   └── components/
│       └── button/
│           └── button.scss    # Annotated component
├── docs/
│   └── index.md               # Homepage (markdown)
├── .stylescriberc.json        # Configuration
└── .stylelintrc.json          # Stylelint config
```

---

## Component Annotations

Document components using JSDoc-style comments:

```scss
/**
 * @title Button
 * @description Interactive button for user actions
 * @navtitle Button
 * @group Interactive
 * @order 1
 * @verified true
 * @role button
 * @maintag button
 * @variations primary, secondary, danger
 * @additional_variations sm, lg
 * @elements icon, label
 * @dependencies base-styles
 * @examples
 * - title: Primary Button
 *   description: Main call-to-action
 *   code: <button class="btn btn--primary">Click</button>
 */

.btn {
  // styles using CSS custom properties
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);

  &--primary {
    background: var(--color-primary);
  }

  &__icon {
    margin-right: var(--spacing-sm);
  }
}
```

### Available Annotations

| Annotation | Description |
|------------|-------------|
| `@title` | Component display name |
| `@description` | Detailed description (supports multiline) |
| `@navtitle` | Short name for navigation |
| `@group` | Category for grouping components |
| `@order` | Sort order (lower = first) |
| `@verified` | Mark as production-ready (`true`/`false`) |
| `@draft` | Mark as work-in-progress (`true`/`false`) |
| `@role` | ARIA role for the component |
| `@maintag` | HTML tag to use (default: `div`) |
| `@variations` | Comma-separated variation names |
| `@additional_variations` | Extra modifiers (size, state) |
| `@elements` | BEM elements within the component |
| `@dependencies` | Other components this depends on |
| `@examples` | Code examples with title/description |

---

## Configuration

Create `.stylescriberc.json` in your project root:

```json
{
  "productionBasepath": "@myorg/design-system/",
  "headIncludes": {
    "css": [
      "./css/variables.css",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700"
    ]
  },
  "components": {
    "groupOrder": ["Foundation", "Interactive", "Layout"]
  },
  "packageFiles": [
    "~@myorg/tokens/variables.css:./css/"
  ]
}
```

### Options

| Property | Description |
|----------|-------------|
| `productionBasepath` | Import path prefix shown in docs |
| `headIncludes.css` | CSS files to include in `<head>` |
| `components.groupOrder` | Order of component groups in nav |
| `packageFiles` | Files to copy from node_modules (`~` prefix) |

---

## Design Tokens

Stylescribe supports the [W3C Design Tokens Community Group](https://tr.designtokens.org/format/) format.

### Token File Format

```json
{
  "color": {
    "primary": {
      "$value": "#0d6efd",
      "$type": "color",
      "$description": "Primary brand color"
    }
  },
  "spacing": {
    "md": {
      "$value": "16px",
      "$type": "dimension"
    }
  }
}
```

### Supported Token Types

- `color` - Colors (#hex, rgb, hsl, oklch)
- `dimension` - Sizes (px, rem, em, %)
- `duration` - Animations (ms, s)
- `fontFamily` - Font stacks
- `fontWeight` - Font weights
- `number` - Unitless numbers
- `shadow` - Box shadows
- `cubicBezier` - Easing functions

---

## Template Customization

Override default templates by creating files in `.stylescribe/templates/`:

```
.stylescribe/
└── templates/
    ├── component.hbs      # Component page
    ├── index.hbs          # Homepage
    ├── pages.hbs          # Documentation pages
    └── includes/
        ├── branding.hbs   # Logo/branding partial
        └── homepage_header.hbs
```

### Handlebars Helpers

| Helper | Usage |
|--------|-------|
| `{{eq a b}}` | Equality check |
| `{{prettyprint code}}` | Format HTML |
| `{{nl2br text}}` | Newlines to `<br>` |
| `{{capitalizeFirst text}}` | Capitalize first letter |
| `{{json data}}` | JSON stringify |

---

## SVG Imports

Import SVGs directly in SCSS - they're converted to base64 data URLs:

```scss
@import "../../icons/check.svg";

.icon-check {
  background-image: url($check);
}
```

---

## Stylelint Integration

Create `.stylelintrc.json`:

```json
{
  "extends": "stylelint-config-standard-scss"
}
```

Or use an empty config to disable linting:

```json
{
  "rules": {}
}
```

---

## Requirements

- Node.js 18.0.0 or higher
- npm or yarn

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup
- How to test changes locally
- Code style guidelines
- Pull request process

---

## License

ISC License - see [LICENSE](./LICENSE) for details.

---

## Links

- [GitHub Repository](https://github.com/solutas/stylescribe)
- [Report Issues](https://github.com/solutas/stylescribe/issues)
- [Example Project](./example/)
