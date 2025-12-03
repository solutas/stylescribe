import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { resolvePath } from '../utils/pathResolver.js';

export const command = 'create-component <name>';
export const desc = 'Create a new component scaffold';

export const builder = (yargs) => {
    yargs
        .positional('name', {
            describe: 'Name of the component to create',
            type: 'string'
        })
        .option('source', {
            describe: 'Source directory for components',
            type: 'string',
            default: "./sass/components",
            coerce: resolvePath
        })
        .option('group', {
            describe: 'Component group',
            type: 'string',
            default: 'Components'
        });
};

export const handler = async (argv) => {
    try {
        const componentDir = path.join(argv.source, argv.name);
        const scssFile = path.join(componentDir, `${argv.name}.scss`);

        if (fs.existsSync(componentDir)) {
            console.error(chalk.red(`Component "${argv.name}" already exists at ${componentDir}`));
            process.exit(1);
        }

        fs.mkdirSync(componentDir, { recursive: true });

        const scssTemplate = `/**
 * @title ${argv.name.charAt(0).toUpperCase() + argv.name.slice(1)}
 * @description A new ${argv.name} component
 * @group ${argv.group}
 * @variations default
 * @elements content
 */

.${argv.name} {
    // Component styles here

    &__content {
        // Element styles here
    }

    &--default {
        // Default variation styles
    }
}
`;

        fs.writeFileSync(scssFile, scssTemplate);

        console.log(chalk.green(` Created component "${argv.name}" at ${componentDir}`));
        console.log(chalk.gray(`  - ${scssFile}`));
    } catch (error) {
        console.error(chalk.bgRed.white.bold('Error creating component:'), chalk.bold(error.message));
        console.error(chalk.gray(error.stack));
        process.exit(1);
    }
};

export default { command, desc, builder, handler };
