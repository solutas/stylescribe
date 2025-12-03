#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import buildCommand from '../commands/build.js';
import devCommand from '../commands/dev.js';
import createComponentCommand from '../commands/createComponent.js';
import createPageCommand from '../commands/createPage.js';
import docs from '../commands/docs.js';
import tokensCommand from '../commands/tokens.js';

yargs(hideBin(process.argv))
    .command(buildCommand)
    .command(devCommand)
    .command(docs)
    .command(createComponentCommand)
    .command(createPageCommand)
    .command(tokensCommand)
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;
