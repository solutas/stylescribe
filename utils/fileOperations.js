import chalk from 'chalk';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import * as sass from 'sass-embedded';
import { pathToFileURL } from 'url';
import { extractAnnotations } from './annotations.js';
import stylelint from 'stylelint';
import chokidar from 'chokidar';
import Handlebars from 'handlebars';
import { html as beautify_html } from 'js-beautify';
import frontMatter from 'front-matter';
import { getTemplatePath } from './pathResolver.js';
import MarkdownIt from 'markdown-it';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const md = new MarkdownIt();

const ensureDir = dirPath => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

function newlineReviver(key, value) {
    if (typeof value === 'string') {
        return value.replace(/\\n/g, '\n');
    }
    return value;
}

export const DEV_SERVER_ROOT = '.stylescribe_dev';

export const BuildEvents = new EventEmitter();

export const buildComponentsData = async (sourceDir, outputDir, watch) => {
    let output = [];
    let components = [];

    try {
        components = await fg([`${outputDir}/components/**/*.json`]);
    } catch (err) {
        console.error(`Error reading files from ${sourceDir}:`, err.message);
        return;
    }

    for (const filePath of components) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const parentDir = path.dirname(filePath);
            const relativePath = path.relative(outputDir, parentDir);
            const name = path.basename(parentDir);

            output.push({
                name,
                ...JSON.parse(fileContent),
                path: relativePath,
            });
        } catch (e) {
            throw new Error("Error reading component detected warnings in the file.");
        }
    }

    const sortedOutput = output.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : Infinity;
        const orderB = b.order !== undefined ? b.order : Infinity;
        return orderA - orderB;
    });
    const outputFilePath = path.join(outputDir, "components.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(sortedOutput, null, 4));

    if (watch) {
        processPackageFiles(process.cwd(), path.join(process.cwd(), DEV_SERVER_ROOT));
        updateComponentJsonWatcher(outputDir);
    }
};

async function updateComponentJsonWatcher(outputDir) {
    const outputFilePath = path.join(outputDir, "components.json");
    const watcher = chokidar.watch(`${outputDir}/components/**/*.json`, {
        persistent: true,
        ignoreInitial: true,
    });

    watcher.on('change', async (changedPath) => {
        const existingData = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
        const changedFileContent = JSON.parse(fs.readFileSync(changedPath, 'utf-8'));
        const parentDir = path.dirname(changedPath);
        const relativePath = path.relative(outputDir, parentDir);
        const name = path.basename(parentDir);
        const updatedContent = { name, ...changedFileContent, path: relativePath };

        const existingIndex = existingData.findIndex(item => item.path === relativePath);

        if (existingIndex !== -1) {
            existingData[existingIndex] = updatedContent;
        } else {
            existingData.push(updatedContent);
        }

        const sortedData = existingData.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : Infinity;
            const orderB = b.order !== undefined ? b.order : Infinity;
            return orderA - orderB;
        });

        fs.writeFileSync(outputFilePath, JSON.stringify(sortedData, null, 4));
        await buildSite(outputDir, path.join(process.cwd(), DEV_SERVER_ROOT));
        BuildEvents.emit('sitebuild:finished');
    });
}

export const buildCssAndAnnotation = async (sourceDir, outputDir, watch) => {
    if (!fs.existsSync(sourceDir)) {
        console.error(`Error: Source directory ${sourceDir} does not exist.`);
        return;
    }

    if (!fs.existsSync(outputDir)) {
        try {
            fs.mkdirSync(outputDir, { recursive: true });
        } catch (err) {
            console.error(`Error creating output directory ${outputDir}:`, err.message);
            return;
        }
    }

    let styleFiles = [];

    try {
        styleFiles = await fg([`${sourceDir}/**/*.css`, `${sourceDir}/components/**/*.scss`]);
    } catch (err) {
        console.error(`Error reading files from ${sourceDir}:`, err.message);
        return;
    }

    for (const filePath of styleFiles) {
        await processStyleFile(filePath, sourceDir, outputDir);
    }

    if (watch) {
        const watcher = chokidar.watch([`${sourceDir}/**/*.css`, `${sourceDir}/**/*.scss`], {
            persistent: true
        });

        watcher.on('change', async (filePath) => {
            console.log(`File changed: ${filePath}`);
            try {
                await processStyleFile(filePath, sourceDir, outputDir);
            } catch (readError) {
                console.error(`Error processing file ${filePath} on change:`, readError.message);
            }
        });
    }
};

const registerPartials = () => {
    const defaultIncludesDir = path.join(__dirname, '..', 'templates', 'includes');
    const cwdIncludesDir = path.join(process.cwd(), '.stylescribe', 'templates', 'includes');

    if (fs.existsSync(defaultIncludesDir)) {
        const files = fs.readdirSync(defaultIncludesDir);
        files.forEach(file => {
            const partial = fs.readFileSync(path.join(defaultIncludesDir, file), 'utf-8');
            const partialName = path.basename(file, '.hbs');
            Handlebars.registerPartial(partialName, partial);
        });
    }

    if (fs.existsSync(cwdIncludesDir)) {
        const files = fs.readdirSync(cwdIncludesDir);
        files.forEach(file => {
            const partial = fs.readFileSync(path.join(cwdIncludesDir, file), 'utf-8');
            Handlebars.registerPartial(path.basename(file, '.hbs'), partial);
        });
    }
};

registerPartials();

const processStyleFile = async (filePath, sourceDir, outputDir) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const result2 = await stylelint.lint({
            code: fileContent,
            formatter: "verbose"
        });

        if (result2.results[0].warnings.length > 0) {
            console.error(chalk.bgRed.white.bold('Stylelint Warnings:'));

            result2.results[0].warnings.forEach(warning => {
                const message = `${warning.line}:${warning.column} - ${warning.text}`;
                console.error(chalk.bgRed.white(message));
            });

            throw new Error("Stylelint detected warnings in the file.");
        }

        const result = await sass.compile(filePath, {
            importers: [
                {
                    canonicalize(url) {
                        if (!url.startsWith('~')) {
                            return null;
                        }
                        let file_in_modules = path.resolve(process.cwd(), 'node_modules', url.substring(1));
                        return new URL(`file://${file_in_modules}`);
                    },
                    load(canonicalUrl) {
                        try {
                            const filePath = canonicalUrl.pathname;
                            const normalizedFilePath = process.platform === 'win32' ? path.normalize(filePath.slice(1)) : path.normalize(filePath);
                            const fileContents = fs.readFileSync(normalizedFilePath, 'utf-8');

                            return {
                                contents: fileContents,
                                syntax: 'scss'
                            };
                        } catch (error) {
                            console.error(`Error reading file ${canonicalUrl}: ${error.message}`);
                            throw error;
                        }
                    }
                },
                {
                    canonicalize(url, options) {
                        if (!url.endsWith('.svg')) {
                            return null;
                        }
                        let containingDir = path.dirname(options.containingUrl.pathname);
                        let svgAbsolutePath = path.resolve(containingDir, url);
                        return new URL(`file://${svgAbsolutePath}`);
                    },
                    load(canonicalUrl) {
                        try {
                            const filePath = canonicalUrl.pathname;
                            const normalizedFilePath = process.platform === 'win32' ? path.normalize(filePath.slice(1)) : path.normalize(filePath);
                            const fileContents = fs.readFileSync(normalizedFilePath, 'utf-8');
                            const base64Encoded = Buffer.from(fileContents).toString('base64');
                            const fileName = path.basename(normalizedFilePath, '.svg');
                            const sassVariable = `$${fileName}: "data:image/svg+xml;base64,${base64Encoded}";`;

                            return {
                                contents: sassVariable,
                                syntax: 'scss'
                            };
                        } catch (error) {
                            console.error(`Error reading file ${canonicalUrl}: ${error.message}`);
                            throw error;
                        }
                    }
                }
            ]
        });

        const output = extractAnnotations(result.css);

        const relativePath = path.relative(sourceDir, filePath);
        const outputFilePath = path.join(outputDir, relativePath).replace(/\.scss$/, '.css');
        const annotationOutputFilePath = path.join(outputDir, relativePath).replace(/\.scss$/, '.json');
        const outputFileDir = path.dirname(outputFilePath);
        if (!fs.existsSync(outputFileDir)) {
            fs.mkdirSync(outputFileDir, { recursive: true });
        }

        fs.writeFileSync(outputFilePath, output.css);
        fs.writeFileSync(annotationOutputFilePath, JSON.stringify(output.annotation));

        console.log(chalk.green(`Compiled and saved to`), outputFilePath);
    } catch (readError) {
        throw new Error(`Error reading file ${filePath}:\n${readError.message}`);
    }
};

const processMarkdownFiles = async (sourceDir, outputDir, context = {}) => {
    const markdownFiles = await fg([`${sourceDir}/docs/**/*.md`]);

    for (const filePath of markdownFiles) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parsedContent = frontMatter(fileContent);
        const htmlContent = md.render(parsedContent.body);

        let outputFilename;
        if (parsedContent.attributes.slug) {
            outputFilename = `${parsedContent.attributes.slug}.html`;
        } else {
            outputFilename = path.basename(filePath, '.md') + '.html';
        }

        let templatePath;
        if (path.basename(filePath) === 'index.md') {
            templatePath = getTemplatePath('index.hbs');
        } else {
            templatePath = getTemplatePath('pages.hbs');
        }

        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateContent);
        const htmlOutput = template({ ...context, ...parsedContent.attributes, content: htmlContent });

        fs.writeFileSync(path.join(outputDir, outputFilename), htmlOutput);
    }
};

const watchDocsFolderForChanges = (sourceDir, outputDir) => {
    const md_dir = path.join(process.cwd(), "docs");
    chokidar.watch(md_dir, { persistent: true }).on('change', async (filePath) => {
        if (path.extname(filePath) === '.md') {
            await buildSite(sourceDir, outputDir, true);
            BuildEvents.emit('sitebuild:finished');
        }
    });
};

export { watchDocsFolderForChanges };

export const processMarkdownFiles_ = async (sourceDir, outputDir, watch) => {
    buildSite(sourceDir, outputDir, true);
    if (watch) {
        watchDocsFolderForChanges(sourceDir, outputDir);
    }
};

// Handlebars helpers
Handlebars.registerHelper('eq', function (a, b) {
    return (a === b);
});

Handlebars.registerHelper('prettyprint', function (content) {
    const html = beautify_html(content);
    return html;
});

Handlebars.registerHelper('nl2br', function (text) {
    const html = (text || '').toString().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
    return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('capitalizeFirst', function (text) {
    if (typeof text !== 'string' || !text) {
        return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
});

Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context);
});

function groupByGroup(components, groupOrder = []) {
    const grouped = components.reduce((acc, component) => {
        (acc[component.group] = acc[component.group] || []).push(component);
        return acc;
    }, {});

    const orderedGroups = {};

    groupOrder.forEach(group => {
        if (grouped[group]) {
            orderedGroups[group] = grouped[group];
            delete grouped[group];
        }
    });

    for (let group in grouped) {
        orderedGroups[group] = grouped[group];
    }

    return orderedGroups;
}

export const buildSite = async (sourceDir, outputDir, withmd = false) => {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const packageJsonPath = path.join(process.cwd(), '.stylescriberc.json');
    let headIncludes = {};
    let externalCssIncludes = [];
    let componentGroupOrder = [];
    let productionBasepath;

    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        headIncludes = packageJson.headIncludes?.css || [];
        externalCssIncludes = headIncludes.filter(include => include.startsWith('http'));
        headIncludes = headIncludes.filter(include => !include.startsWith('http'));

        componentGroupOrder = packageJson.components?.groupOrder || [];
        productionBasepath = packageJson.productionBasepath;
    }

    const componentsFilePath = path.join(sourceDir, 'components.json');
    const componentsJson = JSON.parse(fs.readFileSync(componentsFilePath, 'utf-8'), newlineReviver);

    const templatePath = getTemplatePath('component.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const groups = groupByGroup(componentsJson, componentGroupOrder);
    if (withmd) {
        processMarkdownFiles(process.cwd(), outputDir, { groups, components: componentsJson, externalCssIncludes, headIncludes });
    }

    componentsJson.forEach(component => {
        const adjustedCssIncludes = (headIncludes || []).map(cssPath => {
            if (cssPath.startsWith('./')) {
                const componentDir = path.dirname(path.join(outputDir, `${component.path}.html`));
                return path.relative(componentDir, path.join(outputDir, cssPath.substring(2)));
            }
            return cssPath;
        });

        const dependencyCssPaths = (component.dependencies || []).map(dep => {
            return `./css/components/${dep}.css`;
        });

        const componentCssRelativePath = `./css/components/${path.basename(component.path)}.css`;
        const allCssIncludes = [...adjustedCssIncludes, ...dependencyCssPaths, componentCssRelativePath];

        const adjustedAllCssIncludes = allCssIncludes.map(cssPath => {
            if (cssPath.startsWith('./')) {
                const componentDir = path.dirname(path.join(outputDir, `${component.path}.html`));
                return path.relative(componentDir, path.join(outputDir, cssPath.substring(2)));
            }
            return cssPath;
        });

        const context = {
            currentPath: component.path,
            components: componentsJson,
            groups,
            page: component,
            headIncludes: adjustedAllCssIncludes,
            externalCssIncludes,
            productionBasepath
        };

        const htmlOutput = template(context);

        const outputFilePath = path.join(outputDir, `${component.path}.html`);
        const outputFileDir = path.dirname(outputFilePath);

        if (!fs.existsSync(outputFileDir)) {
            fs.mkdirSync(outputFileDir, { recursive: true });
        }

        const componentCssSource = path.join(sourceDir, component.path, `${path.basename(component.path)}.css`);

        if (fs.existsSync(componentCssSource)) {
            const cssOutputPath = path.join(outputDir, 'css', 'components', `${path.basename(component.path)}.css`);
            ensureDir(path.dirname(cssOutputPath));
            fs.copyFileSync(componentCssSource, cssOutputPath);
        }

        fs.writeFileSync(outputFilePath, htmlOutput);
    });
};

export const processPackageFiles = async (cwd, outputDir) => {
    const packageJsonPath = path.join(cwd, '.stylescriberc.json');

    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.packageFiles) {
        return;
    }

    packageJson.packageFiles.forEach(entry => {
        const [src, tgt] = entry.split(':');

        let srcPath;
        if (src.startsWith('~')) {
            srcPath = path.join(cwd, 'node_modules', src.substring(1));
        } else {
            srcPath = path.isAbsolute(src) ? src : path.join(cwd, src);
        }

        let targetPath = path.join(outputDir, tgt);

        if (fs.statSync(srcPath).isFile()) {
            targetPath = path.join(targetPath, path.basename(srcPath));
        }

        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copySync(srcPath, targetPath);
        console.log(chalk.green(`Copied packaged dependency`), src, tgt);
    });
};

// Re-export processMarkdownFiles with original name for backward compatibility
export { processMarkdownFiles_ as processMarkdownFiles };
