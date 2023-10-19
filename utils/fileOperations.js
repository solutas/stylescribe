const chalk = require("chalk");
const fg = require('fast-glob');
const fs = require('fs-extra');
const path = require('path')
const sass = require('sass-embedded');
const { pathToFileURL } = require('url');
const { extractAnnotations } = require("./annotations");
const stylelint = require('stylelint');
const chokidar = require('chokidar');
const handlebars = require('handlebars');
const beautify_html = require('js-beautify').html;
const frontMatter = require('front-matter');
var MarkdownIt = require('markdown-it'),
    md = new MarkdownIt();

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

const DEV_SERVER_ROOT =  '.stylescribe_dev';


exports.DEV_SERVER_ROOT = DEV_SERVER_ROOT;

const EventEmitter = require('events');
const BuildEvents = new EventEmitter();
exports.BuildEvents = BuildEvents;


exports.buildComponentsData = async (sourceDir, outputDir, watch) => {
    let output = []
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

}

async function updateComponentJsonWatcher(outputDir) {
    const outputFilePath = path.join(outputDir, "components.json");
    const watcher = chokidar.watch(`${outputDir}/components/**/*.json`, {
        persistent: true,
        ignoreInitial: true,
    });

    watcher.on('change', async (changedPath) => {

        // console.log(`File ${changedPath} has been changed`);

        // Read and parse the existing components.json
        const existingData = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));

        // Read the changed JSON file
        const changedFileContent = JSON.parse(fs.readFileSync(changedPath, 'utf-8'));
        const parentDir = path.dirname(changedPath);
        const relativePath = path.relative(outputDir, parentDir);
        const name = path.basename(parentDir);
        const updatedContent = { name, ...changedFileContent, path: relativePath };

        // Check if this file's content already exists in components.json
        const existingIndex = existingData.findIndex(item => item.path === relativePath);

        if (existingIndex !== -1) {
            // Update the existing content
            existingData[existingIndex] = updatedContent;
        } else {
            // If it doesn't exist, add it
            existingData.push(updatedContent);
        }

        // Sort and write back to components.json
        const sortedData = existingData.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : Infinity;
            const orderB = b.order !== undefined ? b.order : Infinity;
            return orderA - orderB;
        });

        fs.writeFileSync(outputFilePath, JSON.stringify(sortedData, null, 4));
        await buildSite(outputDir, path.join(process.cwd(), DEV_SERVER_ROOT))
        BuildEvents.emit('sitebuild:finished');
    });
}





exports.buildCssAndAnnotation = async (sourceDir, outputDir, watch) => {
    // Ensure the source directory exists
    if (!fs.existsSync(sourceDir)) {
        console.error(`Error: Source directory ${sourceDir} does not exist.`);
        return;
    }

    // Check if outputDir exists. If not, create it.
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
        await processStyleFile(filePath, sourceDir, outputDir)
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


const processStyleFile = async (filePath, sourceDir, outputDir) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const result2 = await stylelint
            .lint({
                code: fileContent,
                formatter: "verbose"
            });

        if (result2.results[0].warnings.length > 0) {
            // Print a header message
            console.error(chalk.bgRed.white.bold('Stylelint Warnings:'));

            result2.results[0].warnings.forEach(warning => {
                const message = `${warning.line}:${warning.column} - ${warning.text}`;
                console.error(chalk.bgRed.white(message));
            });

            // Throw an error to indicate the presence of warnings
            throw new Error("Stylelint detected warnings in the file.");
        }

        // Process the file content, extract annotations, etc.
        const result = await sass.compile(filePath, {
            importers: [{
                canonicalize(url) {
                    if (!url.startsWith('~')) {
                        return null; // This importer doesn't recognize the URL, so it returns null.
                    }

                    let file_in_modules = path.resolve(process.cwd(), 'node_modules', url.substring(1));
                    return new URL(`file://${file_in_modules}`);
                },
                load(canonicalUrl) {
                    try {
                        const filePath = canonicalUrl.pathname;
                        // On Windows, URL's pathname might start with an extra '/', so you'd need to remove it
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
            }]
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
        // console.error(`Error reading file ${filePath}:`, readError.message);
        throw new Error(`Error reading file ${filePath}:\n${readError.message}`);
    }

    // If there's additional logic for processing the file, consider adding more try/catch blocks
    try {
        // For example, processing the annotations

    } catch (processError) {
        throw new Error(`Error processing annotations in ${filePath}:\n${readError.message}`);
    }
}

const processMarkdownFiles = async (sourceDir, outputDir, context={}) => {
    // Glob for markdown files
    const markdownFiles = await fg([`${sourceDir}/docs/**/*.md`]);
    
    for (const filePath of markdownFiles) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Extract front matter and content
        const parsedContent = frontMatter(fileContent);
        const htmlContent = md.render(parsedContent.body);
        
        let outputFilename;
        if (parsedContent.attributes.slug) {
            outputFilename = `${parsedContent.attributes.slug}.html`;
        } else {
            outputFilename = path.basename(filePath, '.md') + '.html';
        }
        
        // Choose a template based on filename
        let templatePath;
        if (path.basename(filePath) === 'index.md') {
            templatePath = path.join(__dirname, "..", "templates", 'index.hbs');
        } else {
            templatePath = path.join(__dirname, "..", "templates", 'pages.hbs');
        }
        
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const template = handlebars.compile(templateContent);
        
        // Merge the data from front matter and the HTML content
        const htmlOutput = template({ ...context, ...parsedContent.attributes, content: htmlContent });
        
        // Write the output HTML
        fs.writeFileSync(path.join(outputDir, outputFilename), htmlOutput);
    }
}
const watchDocsFolderForChanges = (sourceDir, outputDir) => {
    const md_dir = path.join(process.cwd(), "docs");
    chokidar.watch(md_dir, { persistent: true }).on('change',async (filePath) => {
        if (path.extname(filePath) === '.md') {
            // processMarkdownFiles(sourceDir, outputDir);
            await buildSite(sourceDir, outputDir, true); // trigger buildSite on changes
            BuildEvents.emit('sitebuild:finished');
        }
    });
}
exports.watchDocsFolderForChanges = watchDocsFolderForChanges;
exports.processMarkdownFiles = async (sourceDir, outputDir, watch) => {        
    buildSite(sourceDir, outputDir, true); // trigger buildSite on changes
    if(watch) {
    watchDocsFolderForChanges(sourceDir, outputDir);    
    }
}


// TODO: extract to own file

handlebars.registerHelper('eq', function (a, b, options) {
    return (a === b)
});
handlebars.registerHelper('prettyprint', function(content) {
    const html = beautify_html(content); // replace stringified \n with actual newline
    return html;
});

handlebars.registerHelper('nl2br', function(text) {
    const html = (text || '').toString().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
    return new handlebars.SafeString(html);
});

function groupByGroup(components, groupOrder = []) {
    // First, group components by their group
    const grouped = components.reduce((acc, component) => {
        (acc[component.group] = acc[component.group] || []).push(component);
        return acc;
    }, {});

    const orderedGroups = {};

    // First, add groups in the predefined order from groupOrder
    groupOrder.forEach(group => {
        if (grouped[group]) {
            orderedGroups[group] = grouped[group];
            delete grouped[group];
        }
    });

    // Then, add remaining groups
    for (let group in grouped) {
        orderedGroups[group] = grouped[group];
    }

    return orderedGroups;
}


const buildSite = async (sourceDir, outputDir, withmd=false) => {
    // Ensure the output directory exists. If not, create it.
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const packageJsonPath = path.join(process.cwd(), '.stylescriberc.json');
    let headIncludes = {};
    let externalCssIncludes = [];
    let componentGroupOrder = [];
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        headIncludes = packageJson.headIncludes?.css || [];
        externalCssIncludes = headIncludes.filter(include => include.startsWith('http'));
        headIncludes = headIncludes.filter(include => !include.startsWith('http'));

        componentGroupOrder = packageJson.components?.groupOrder || [];
        
    }

    // Read components.json
    const componentsFilePath = path.join(sourceDir, 'components.json');
    const componentsJson = JSON.parse(fs.readFileSync(componentsFilePath, 'utf-8'), newlineReviver);

    // Read the Handlebars template
    const templatePath = path.join(__dirname, '..', 'templates', 'component.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);

    const groups = groupByGroup(componentsJson, componentGroupOrder);
    if(withmd) {
        processMarkdownFiles(process.cwd(), outputDir, { groups, components: componentsJson, externalCssIncludes, headIncludes});
    }

    // For each component, generate HTML using the template and save it
    componentsJson.forEach(component => {
        // Adjust the CSS paths for the current component        
        const adjustedCssIncludes = (headIncludes || []).map(cssPath => {
            if (cssPath.startsWith('./')) {
                // Determine the directory of the current component's HTML file
                const componentDir = path.dirname(path.join(outputDir, `${component.path}.html`));

                // Calculate the relative path from the current component's directory to the CSS file
                return path.relative(componentDir, path.join(outputDir, cssPath.substring(2)));
            }
            return cssPath;
        });

        // Process component dependencies
        const dependencyCssPaths = (component.dependencies || []).map(dep => {
            return `./css/components/${dep}.css`;
        });

        // Adjust paths for component's own CSS and its dependencies
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
            externalCssIncludes
        };

        
        const htmlOutput = template(context);

        const outputFilePath = path.join(outputDir, `${component.path}.html`);
        const outputFileDir = path.dirname(outputFilePath);

        // Ensure the directory for the current component exists
        if (!fs.existsSync(outputFileDir)) {
            fs.mkdirSync(outputFileDir, { recursive: true });
        }

        // Check if there's a CSS file named after the component in the source directory
        const componentCssSource = path.join(sourceDir, component.path, `${path.basename(component.path)}.css`);

        if (fs.existsSync(componentCssSource)) {
            const cssOutputPath = path.join(outputDir, 'css', 'components', `${path.basename(component.path)}.css`);
            ensureDir(path.dirname(cssOutputPath));
            fs.copyFileSync(componentCssSource, cssOutputPath);
        }

        fs.writeFileSync(outputFilePath, htmlOutput);
    });
};


const processPackageFiles = async (cwd, outputDir) => {
    // Read package.json from the current working directory
    const packageJsonPath = path.join(cwd, '.stylescriberc.json');

    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.packageFiles) {
        return;
    }


    // For each entry in packageFiles, process and copy over
    packageJson.packageFiles.forEach(entry => {
        const [src, tgt] = entry.split(':');

        let srcPath;
        if (src.startsWith('~')) {
            // Located in node_modules
            srcPath = path.join(cwd, 'node_modules', src.substring(1));
        } else {
            // Relative or absolute path
            srcPath = path.isAbsolute(src) ? src : path.join(cwd, src);
        }

        let targetPath = path.join(outputDir, tgt);

        // If srcPath is a file, append its name to the target path
        if (fs.statSync(srcPath).isFile()) {
            targetPath = path.join(targetPath, path.basename(srcPath));
        }

        // Ensure the target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy file or directory        
        fs.copySync(srcPath, targetPath);
        console.log(chalk.green(`Copied packaged dependency`), src, tgt);
    });
};
exports.buildSite = buildSite;
exports.processPackageFiles = processPackageFiles;
