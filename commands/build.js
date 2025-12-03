import chalk from 'chalk';
import { buildComponentsData, buildCssAndAnnotation, processPackageFiles } from '../utils/fileOperations.js';
import { resolvePath } from '../utils/pathResolver.js';

export const command = 'build';
export const desc = 'Generate the static site';

export const builder = (yargs) => {
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
        });
};

export const handler = async (argv) => {
    try {
        await buildCssAndAnnotation(argv.source, argv.output, false);
        await buildComponentsData(argv.source, argv.output, false);
        processPackageFiles(process.cwd(), argv.output);
    } catch (error) {
        console.error(chalk.bgRed.white.bold('Error occurred during build:'), chalk.bold(error.message));
        console.error(chalk.gray(error.stack));
        process.exit(1);
    }
};

export default { command, desc, builder, handler };
