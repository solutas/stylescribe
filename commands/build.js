const chalk = require("chalk");
const { buildComponentsData,  buildCssAndAnnotation, processPackageFiles} = require('../utils/fileOperations');
const { resolvePath } = require('../utils/pathResolver');

exports.command = 'build';
exports.desc = 'Generate the static site';
exports.builder = (yargs) => {
    yargs
        .option('source', {
            describe: 'Source directory of CSS/SCSS files',
            type: 'string',
            demandOption: true,
            default: "./sass",
            coerce: resolvePath  
        })
        .option('output', {
            describe: 'Output directory for the generated site',
            type: 'string',
            demandOption: true,
            default: "./build",
            coerce: resolvePath  
        })
};
exports.handler = async (argv) => {
    try {
        await buildCssAndAnnotation(argv.source, argv.output, false);
        await buildComponentsData(argv.source, argv.output, false);
        processPackageFiles(process.cwd(), argv.output);
    } catch (error) {
        console.error(chalk.bgRed.white.bold('Error occurred during build:'), chalk.bold(error.message));
        // Optionally, log the complete error stack for detailed debugging
        console.error(chalk.gray(error.stack));
        process.exit(1);  // Exit with error code
    }
};