import chalk from 'chalk';
import { buildSite, DEV_SERVER_ROOT, processPackageFiles, buildCssAndAnnotation, buildComponentsData, processMarkdownFiles } from '../utils/fileOperations.js';
import { resolvePath } from '../utils/pathResolver.js';
import { DevServer } from '../utils/devserver.js';

export const command = 'dev';
export const desc = 'Generate Docs';

export const builder = (yargs) => {
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
            type: 'boolean',
            default: true
        });
};

export const handler = async (argv) => {
    try {
        processPackageFiles(process.cwd(), DEV_SERVER_ROOT);
        await buildCssAndAnnotation(argv.source, argv.buildTarget, argv.watch);
        await buildComponentsData(argv.source, argv.buildTarget, argv.watch);
        await buildSite(argv.buildTarget, DEV_SERVER_ROOT, argv.watch);
        processMarkdownFiles(argv.buildTarget, DEV_SERVER_ROOT, argv.watch);
        DevServer(DEV_SERVER_ROOT);
    } catch (error) {
        console.error(chalk.bgRed.white.bold('Error occurred during build:'), chalk.bold(error.message));
        console.error(chalk.gray(error.stack));
        process.exit(1);
    }
};

export default { command, desc, builder, handler };
