const chalk = require("chalk");
const { buildSite, DEV_SERVER_ROOT, processPackageFiles, buildCssAndAnnotation, buildComponentsData, processMarkdownFiles} = require('../utils/fileOperations');
const { resolvePath  } = require('../utils/pathResolver');
const { DevServer } = require("../utils/devserver");
exports.command = 'dev';
exports.desc = 'Generate Docs';
exports.builder = (yargs) => {
    yargs
        .option('source', {
            describe: 'Source directory of CSS/SCSS files',
            type: 'string',
            demandOption: true,
            default: "./sass",
            coerce: resolvePath  
        })
        .option('build-target', {
            describe: 'build-target',
            type: 'string',
            demandOption: true,      
            default: "./build",      
            coerce: resolvePath  
        })
        .option('watch', {
            describe: 'Watch for file changes and rebuild as necessary',
            type: 'boolean',  // This means the option is either set (true) or not (false)
            default: true
        });
};
exports.handler = async (argv) => {
    try {                
        processPackageFiles(process.cwd(), DEV_SERVER_ROOT);
        await buildCssAndAnnotation(argv.source, argv.buildTarget, argv.watch);
        await buildComponentsData(argv.source, argv.buildTarget, argv.watch);        
        await buildSite(argv.buildTarget, DEV_SERVER_ROOT, argv.watch);                        
        processMarkdownFiles(argv.buildTarget, DEV_SERVER_ROOT, argv.watch);
        DevServer(DEV_SERVER_ROOT);
    } catch (error) {
        console.error(chalk.bgRed.white.bold('Error occurred during build:'), chalk.bold(error.message));
        // Optionally, log the complete error stack for detailed debugging
        console.error(chalk.gray(error.stack));
        process.exit(1);  // Exit with error code
    }
};