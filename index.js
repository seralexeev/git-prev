import inquirer, { Separator } from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'
import fetch from 'node-fetch'
import 'babel-polyfill'
import fs from 'fs'
import { exec } from 'child_process'
import path from 'path'
import meow from 'meow'
import fuzzy from 'fuzzy'

inquirer.registerPrompt('autocomplete', autocomplete);

(async (data) => {
  try {
    data = await Promise.all([
      getAllBranches(),
      getHistory().catch(_ => console.warn('Can\'t find checkout history. Please use git prev setup')),
      getRemotes()
    ].map(x => x.then(x => x).catch(e => { })))
  } catch (e) { }

  const [
    allBranches = [],
    history = [],
    remotes = []
  ] = data

  showCli({ allBranches, history, remotes })
})()

const searchBranch = async ({ history, allBranches }, input) => {
  if (!input) {
    if (history.length) {
      return history
    } else {
      return allBranches
    }
  }

  return fuzzy.filter(input, allBranches).map(x => x.original)
}

function showCli(data) {
  const commands = { createPromt, setup }

  const cli = meow(`
    Usage
      $ git prev

    Setup git hook for checkout history
      $ git prev setup
  `)

  const [command = 'createPromt'] = cli.input

  if (command in commands) {
    commands[command](data, cli.flags)
  } else {
    cli.showHelp()
  }
}

function createPromt(data, flags) {
  const promts = [{
    type: 'autocomplete',
    name: 'branch',
    message: 'Select branch',
    source: (_, input) => searchBranch(data, input),
    pageSize: 15
  }]

  const { remotes } = data
  const regexp = new RegExp(`(${remotes.join('|')})\/`)

  inquirer.prompt(promts).then(({ branch }) => {
    execute(`git checkout ${branch.replace(regexp, '')}`)
  })
}

function setup() {
  execute(`git rev-parse --show-toplevel`).then(x => {
    fs.readFile(path.join(__dirname, 'post-checkout'), (err, data) => {
      if (err)
        throw err

      fs.writeFile(path.join(x.trim(), '.git', 'hooks', 'post-checkout'), data, err => {
        if (err)
          throw err

        console.log('success')
      })
    })
  })
}

function getRemotes() {
  return execute('git remote')
    .then(stdout => stdout.split('\n').map(x => x.trim()).filter(x => !!x))
}

function getAllBranches() {
  return execute('git for-each-ref refs --format=%(refname:short)')
    .then(stdout => stdout.split('\n').map(x => x.trim()).filter(x => !!x))
}

function getHistory() {
  return execute(`git rev-parse --show-toplevel`).then(x =>
    new Promise((resolve, reject) => {
      fs.readFile(path.join(x.trim(), '.git', 'checkout-history'), 'utf8', (err, data) => {
        if (err) {
          reject(err)

        } else {
          resolve([...new Set(data.split('\n').map(x => x.trim()).filter(x => !!x).reverse())])
        }
      })
    })
  )
}

function execute(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })
}
