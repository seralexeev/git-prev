import inquirer, { Separator } from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'
import fetch from 'node-fetch'
import 'babel-polyfill'
import fs from 'fs'
import { spawn, exec, execFile } from 'child_process'

inquirer.registerPrompt('autocomplete', autocomplete);

fs.readFile('.git/checkout-history', 'utf8', (e, data) => {
    createPromt(data.split('\n').filter(x => x).reverse().slice(0, 10))
})

const createPromt = (list) => {

    const promts = [{
        type: 'autocomplete',
        name: 'branch',
        message: 'Select branch',
        source: async() => list,
        pageSize: 100
    }]

    inquirer.prompt(promts).then(({ branch }) => {
        execFile('git', ['checkout', branch], (error, stdout, stderr) => {
            if (error) {
                console.error(stderr)
            }
        })
    })
}