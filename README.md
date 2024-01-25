# stylescribe: A Style Guide Builder

`stylescribe` is an open-source style guide building tool optimized for crafting design systems. While it's in active development, this tool aims to offer an intuitive way for developers to document and present CSS and SASS components.

## Installation

To install `stylescribe`, you have two options:

### Globally:

```bash
npm install -g stylescribe
```

### Locally:

```bash
npm install stylescribe --save-dev
```

If you choose a local installation, you can add a script in your `package.json` to run `stylescribe` commands with ease.

## Usage

```bash
stylescribe <command>
```

### Commands:
- `stylescribe build`: Generate the static site.
- `stylescribe dev`: Generate Docs.

### Options:
- `--version`: Show version number.
- `--help`: Show help.


## Configuration Explanation: `.stylescriberc.json`

The `.stylescriberc.json` configuration file allows you to customize how `stylescribe` processes and presents your style guide. Below is a breakdown of its properties:

### `packageFiles`:
This is an array of mappings that delineate the source and destination for specific CSS files. For instance:

```json
"~@solutas/magnolia-ds-token/build/css/_variables.css:./css/"
```
This indicates that the `_variables.css` file from the `magnolia-ds-token` package should be processed and placed into the `./css/` directory of your style guide.

### `headIncludes`:
This property dictates additional files or external resources that should be appended to the `<head>` section of your generated style guide. It helps integrate external stylesheets, fonts, or other relevant resources. Its structure:

- **`css`**: An array where you can specify paths to the CSS files for inclusion.

From the provided example:
1. `./css/_variables.css`: A local path, implying that the `_variables.css` file will be linked in the `<head>` of the style guide once processed.
2. A Google Fonts URL: An external link to fetch the 'Roboto' font in various weights and styles, enabling the 'Roboto' font for use in the style guide.

### `components`:
This property manages how component groups are organized and displayed.
- **`groupOrder`**: An array that sets the sequence of component groups. In the example, `"Base"` components are displayed before `"UI Components"`.

### `productionBasepath`:

This is passed to the ```components.hbs``` template and is used to display the location of the css file in production. e.g. ```@solutas/my-css-package/build```.


## Template Customization:
`stylescribe` allows for customization of Handlebars templates used for generating the style guide. Users can overwrite the default templates or extend the functionality by adding their own templates.

- Templates should be placed in the `.stylescribe/templates` directory in your project's root.
- Partials (reusable template snippets) should be added to `.stylescribe/templates/includes`.
- If a template or partial exists in the `.stylescribe` directory, it will be used instead of the default one.

These are the existing templates and includes which can be customized at the moment:
```
├── component.hbs
├── includes
│   ├── branding.hbs
│   └── homepage_header.hbs
├── index.hbs
└── pages.hbs
````

This allows for a high degree of customization, enabling you to tailor the style guide to your project's specific needs.


## Source File Structure:

Expected file organization is:

```
saas/
  components/
    componentname/
      componentname.scss
```

## Annotations:

You can annotate each component to provide essential metadata:

```css
/**
 * @title Button Component
 * @description this is a description of the component 
 secpond line.
 * @navtitle Button
 * @variations primary, secondary, danger
 * @elements text
 * @additional_variations md  
 * @group From 
 * @role button 
 * @dependencies shell
 * @order -13
 */
```

### Manual Documentation:

Place detailed documentation inside the `docs` directory. The `index.md` serves as the homepage. You can use optional frontmatter for titles or slugs.

### Style Linting:

Ensure there's a `.stylelintrc.json` in the root directory:

```json
{
    "extends": "stylelint-config-standard-scss"
}
```

## Handling SVG Imports in SCSS Files

`stylescribe` offers a unique feature allowing you to import SVG files directly within your SCSS files. This functionality simplifies the process of using SVG icons and graphics in your stylesheets.

### How to Import SVGs

To import an SVG file into your SCSS, use the standard `@import` statement followed by the relative path to the SVG file. For example:

```scss
@import "../../assets/icons/checkbox-semi.svg";
```

### Conversion to SASS Variables
Once imported, `stylescribe` processes the SVG file and converts it into a SASS variable. This variable represents the SVG as a base64-encoded data URL, making it easy to incorporate into your CSS. For example, the SVG file checkbox-semi.svg would be available as a variable like:

```scss
content: url($checkbox-semi);
```

During the build process, stylescribe resolves these imports.


## Feedback & Contributions:

Being an open-source project, we encourage feedback and contributions. Join us in refining and expanding `stylescribe`.

Happy documenting!

