#!/usr/bin/env node

const inquirer = require('inquirer');
const autocomplete = require('inquirer-autocomplete-prompt');
const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');
const meow = require('meow');
const fuzzy = require('fuzzy');

inquirer.registerPrompt('autocomplete', autocomplete);

(async () => {
    const [allBranches = [], history = [], remotes = []] = await Promise.all([
        getAllBranches(),
        getHistory(),
        getRemotes(),
    ]);

    showCli({ allBranches, history, remotes });
})();

const searchBranch = async ({ history, allBranches }, input) => {
    if (!input) {
        return history.length ? history : allBranches;
    }

    return fuzzy.filter(input, allBranches).map((x) => x.original);
};

function showCli(data) {
    const commands = { createPromt, setup };

    const cli = meow(`
    Usage
      $ git prev

    Setup git hook for checkout history
      $ git prev setup
  `);

    const [command = 'createPromt'] = cli.input;

    if (command in commands) {
        commands[command](data, cli.flags);
    } else {
        cli.showHelp();
    }
}

async function createPromt(data) {
    const promts = [
        {
            type: 'autocomplete',
            name: 'branch',
            message: 'Select branch',
            source: (_, input) => searchBranch(data, input),
            pageSize: 15,
        },
    ];

    const { remotes } = data;
    const regexp = new RegExp(`(${remotes.join('|')})\/`);

    const { branch } = await inquirer.prompt(promts);
    await execute(`git checkout ${branch.replace(regexp, '')}`);
}

async function setup() {
    const root = await getGitRoot();
    const hook = await fs.readFile(path.join(__dirname, 'post-checkout'));
    await fs.writeFile(path.join(root, 'hooks', 'post-checkout'), hook);
    await fs.writeFile(path.join(root, 'checkout-history'), '');
    console.info('success');
}

async function getRemotes() {
    try {
        const stdout = await execute('git remote');
        return stdout
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean);
    } catch (e) {
        console.warn(e);
        return [];
    }
}

async function getAllBranches() {
    const stdout = await execute('git for-each-ref refs --format="%(refname:short)"');
    return stdout
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
}

async function getGitRoot() {
    const root = await execute(`git rev-parse --show-toplevel`);
    return path.join(root.trim(), '.git');
}

async function getHistory() {
    try {
        const root = await getGitRoot();
        const data = await fs.readFile(path.join(root, 'checkout-history'), 'utf8');
        return [
            ...new Set(
                data
                    .split('\n')
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .reverse(),
            ),
        ];
    } catch (e) {
        console.warn("Can't find checkout history. Please use git prev setup");
        return [];
    }
}

function execute(command) {
    return new Promise((resolve, reject) => exec(command, (err, stdout) => (err ? reject(err) : resolve(stdout))));
}
