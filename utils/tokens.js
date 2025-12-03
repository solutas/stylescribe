/**
 * W3C Design Tokens Community Group (DTCG) Format Support
 * Spec: https://tr.designtokens.org/format/
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Supported token types per W3C DTCG spec
const TOKEN_TYPES = {
    COLOR: 'color',
    DIMENSION: 'dimension',
    FONT_FAMILY: 'fontFamily',
    FONT_WEIGHT: 'fontWeight',
    DURATION: 'duration',
    CUBIC_BEZIER: 'cubicBezier',
    NUMBER: 'number',
    STRING: 'string',
    COMPOSITE: 'composite',
    STROKE_STYLE: 'strokeStyle',
    BORDER: 'border',
    TRANSITION: 'transition',
    SHADOW: 'shadow',
    GRADIENT: 'gradient',
    TYPOGRAPHY: 'typography'
};

/**
 * Parse CSS content and extract CSS custom properties as design tokens
 */
export function extractTokensFromCSS(cssContent, options = {}) {
    const tokens = {};
    const { prefix = '', includeComments = true } = options;

    // Match CSS custom property definitions
    const cssVarRegex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    // Match comments before variable declarations
    const commentRegex = /\/\*\s*(.*?)\s*\*\/\s*\n\s*(--[a-zA-Z0-9-_]+)/gs;

    const comments = {};

    // Extract comments associated with variables
    if (includeComments) {
        let commentMatch;
        while ((commentMatch = commentRegex.exec(cssContent)) !== null) {
            const comment = commentMatch[1].trim();
            const varName = commentMatch[2].replace('--', '');
            comments[varName] = comment;
        }
    }

    let match;
    while ((match = cssVarRegex.exec(cssContent)) !== null) {
        const name = match[1];
        const value = match[2].trim();

        // Skip if prefix filter is set and doesn't match
        if (prefix && !name.startsWith(prefix)) {
            continue;
        }

        const token = {
            $value: value,
            $type: inferTokenType(value)
        };

        if (comments[name]) {
            token.$description = comments[name];
        }

        // Build nested structure from name (e.g., "color-primary-500" -> { color: { primary: { 500: ... } } })
        setNestedToken(tokens, name, token);
    }

    return tokens;
}

/**
 * Infer token type from value
 */
function inferTokenType(value) {
    // Color patterns
    if (value.startsWith('#') ||
        value.startsWith('rgb') ||
        value.startsWith('hsl') ||
        value.startsWith('oklch') ||
        value.startsWith('lab') ||
        value.startsWith('lch')) {
        return TOKEN_TYPES.COLOR;
    }

    // Dimension patterns (px, rem, em, %, vw, vh, etc.)
    if (/^-?\d+(\.\d+)?(px|rem|em|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/.test(value)) {
        return TOKEN_TYPES.DIMENSION;
    }

    // Duration patterns
    if (/^-?\d+(\.\d+)?(ms|s)$/.test(value)) {
        return TOKEN_TYPES.DURATION;
    }

    // Font weight patterns
    if (/^(100|200|300|400|500|600|700|800|900|normal|bold|lighter|bolder)$/.test(value)) {
        return TOKEN_TYPES.FONT_WEIGHT;
    }

    // Font family patterns
    if (value.includes(',') && (value.includes('sans-serif') || value.includes('serif') || value.includes('monospace'))) {
        return TOKEN_TYPES.FONT_FAMILY;
    }

    // Number patterns
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return TOKEN_TYPES.NUMBER;
    }

    // Cubic bezier
    if (value.startsWith('cubic-bezier')) {
        return TOKEN_TYPES.CUBIC_BEZIER;
    }

    // Default to string
    return TOKEN_TYPES.STRING;
}

/**
 * Set a nested token value using dot-separated or hyphen-separated path
 */
function setNestedToken(obj, path, value) {
    const parts = path.split('-').filter(Boolean);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }

    current[parts[parts.length - 1]] = value;
}

/**
 * Flatten nested tokens to CSS custom properties
 */
function flattenTokens(tokens, prefix = '', result = {}) {
    for (const [key, value] of Object.entries(tokens)) {
        const newPrefix = prefix ? `${prefix}-${key}` : key;

        if (value && typeof value === 'object' && '$value' in value) {
            result[newPrefix] = value;
        } else if (value && typeof value === 'object') {
            flattenTokens(value, newPrefix, result);
        }
    }

    return result;
}

/**
 * Convert W3C design tokens to CSS custom properties
 */
export function tokensToCss(tokens, options = {}) {
    const {
        selector = ':root',
        indent = '  ',
        includeComments = true
    } = options;

    const flatTokens = flattenTokens(tokens);
    let css = `${selector} {\n`;

    for (const [name, token] of Object.entries(flatTokens)) {
        if (includeComments && token.$description) {
            css += `${indent}/* ${token.$description} */\n`;
        }
        css += `${indent}--${name}: ${resolveTokenValue(token.$value, tokens)};\n`;
    }

    css += '}\n';

    return css;
}

/**
 * Resolve token references (aliases)
 */
function resolveTokenValue(value, tokens) {
    if (typeof value !== 'string') {
        return value;
    }

    // Match token references like {color.primary.500}
    const refRegex = /\{([^}]+)\}/g;

    return value.replace(refRegex, (match, path) => {
        const parts = path.split('.');
        let current = tokens;

        for (const part of parts) {
            if (current && current[part]) {
                current = current[part];
            } else {
                return match; // Return original if not found
            }
        }

        if (current && current.$value) {
            return resolveTokenValue(current.$value, tokens);
        }

        return match;
    });
}

/**
 * Convert W3C design tokens to SCSS variables
 */
export function tokensToScss(tokens, options = {}) {
    const { includeComments = true, includeMap = true } = options;
    const flatTokens = flattenTokens(tokens);

    let scss = '';

    // Generate individual variables
    for (const [name, token] of Object.entries(flatTokens)) {
        if (includeComments && token.$description) {
            scss += `// ${token.$description}\n`;
        }
        scss += `$${name}: ${resolveTokenValue(token.$value, tokens)};\n`;
    }

    // Generate SCSS map
    if (includeMap) {
        scss += '\n// Design tokens map\n';
        scss += '$design-tokens: (\n';

        for (const [name, token] of Object.entries(flatTokens)) {
            scss += `  '${name}': $${name},\n`;
        }

        scss += ');\n';
    }

    return scss;
}

/**
 * Convert W3C design tokens to JSON (Style Dictionary compatible)
 */
export function tokensToStyleDictionary(tokens) {
    function convertToken(token, name) {
        if (token.$value !== undefined) {
            return {
                value: token.$value,
                type: token.$type || 'string',
                description: token.$description || undefined,
                name: name
            };
        }

        const result = {};
        for (const [key, value] of Object.entries(token)) {
            if (key.startsWith('$')) continue;
            result[key] = convertToken(value, `${name}-${key}`);
        }
        return result;
    }

    const result = {};
    for (const [key, value] of Object.entries(tokens)) {
        result[key] = convertToken(value, key);
    }

    return result;
}

/**
 * Validate tokens against W3C DTCG spec
 */
export function validateTokens(tokens, errors = [], path = '') {
    for (const [key, value] of Object.entries(tokens)) {
        const currentPath = path ? `${path}.${key}` : key;

        // Skip if it's a token metadata key
        if (key.startsWith('$')) {
            continue;
        }

        if (value && typeof value === 'object') {
            // Check if it looks like a token (has $type or other $ keys but might be missing $value)
            const hasTokenKeys = Object.keys(value).some(k => k.startsWith('$'));

            if ('$value' in value) {
                // Validate required $value is not null/undefined
                if (value.$value === undefined || value.$value === null) {
                    errors.push({
                        path: currentPath,
                        message: 'Token must have a $value'
                    });
                }

                // Validate $type if present
                if (value.$type && !Object.values(TOKEN_TYPES).includes(value.$type)) {
                    errors.push({
                        path: currentPath,
                        message: `Invalid token type: ${value.$type}`,
                        validTypes: Object.values(TOKEN_TYPES)
                    });
                }
            } else if (hasTokenKeys) {
                // Has token metadata keys but no $value - this is an error
                errors.push({
                    path: currentPath,
                    message: 'Token must have a $value'
                });
            } else {
                // Recurse into nested groups
                validateTokens(value, errors, currentPath);
            }
        }
    }

    return errors;
}

/**
 * Merge multiple token files
 */
export function mergeTokens(...tokenSets) {
    const result = {};

    for (const tokens of tokenSets) {
        deepMerge(result, tokens);
    }

    return result;
}

function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) {
                target[key] = {};
            }
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

/**
 * Load tokens from a file (JSON or tokens.json)
 */
export async function loadTokensFromFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Save tokens to a file
 */
export async function saveTokensToFile(tokens, filePath, options = {}) {
    const { indent = 2 } = options;
    const content = JSON.stringify(tokens, null, indent);
    await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Extract tokens from SCSS files
 */
export function extractTokensFromScss(scssContent, options = {}) {
    const tokens = {};
    const { includeComments = true } = options;

    // Match SCSS variable definitions
    const scssVarRegex = /\$([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    // Match comments before variable declarations
    const commentRegex = /\/\/\s*(.*?)\n\s*(\$[a-zA-Z0-9-_]+)/gs;

    const comments = {};

    // Extract comments
    if (includeComments) {
        let commentMatch;
        while ((commentMatch = commentRegex.exec(scssContent)) !== null) {
            const comment = commentMatch[1].trim();
            const varName = commentMatch[2].replace('$', '');
            comments[varName] = comment;
        }
    }

    let match;
    while ((match = scssVarRegex.exec(scssContent)) !== null) {
        const name = match[1];
        const value = match[2].trim();

        const token = {
            $value: value,
            $type: inferTokenType(value)
        };

        if (comments[name]) {
            token.$description = comments[name];
        }

        setNestedToken(tokens, name, token);
    }

    return tokens;
}

export { TOKEN_TYPES };
