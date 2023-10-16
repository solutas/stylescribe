#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const buildCommand = require('../commands/build');
const devCommand = require('../commands/dev');
const createComponentCommand = require('../commands/createComponent');
const createPageCommand = require('../commands/createPage');
const docs = require('../commands/docs');

yargs(hideBin(process.argv))
    .command(buildCommand)
    .command(devCommand)
    .command(docs)
    .command(createComponentCommand)
    .command(createPageCommand)
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .argv;
