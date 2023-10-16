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

## Feedback & Contributions:

Being an open-source project, we encourage feedback and contributions. Join us in refining and expanding `stylescribe`.

Happy documenting!

