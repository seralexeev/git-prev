import inquirer, { Separator } from 'inquirer'
import autocomplete from 'inquirer-autocomplete-prompt'
import fetch from 'node-fetch'
import 'babel-polyfill'
import fs from 'fs'
import { spawn, exec, execFile } from 'child_process'
import meow from 'meow'
import fuzzy from 'fuzzy'

inquirer.registerPrompt('autocomplete', autocomplete);

let allBranches, history, remoutes

const loadHostory = () => new Promise((resolve, reject) => {
  fs.readFile('.git/checkout-history', 'utf8', (err, data) => {
    if (err) {
      history = []
      reject(err)
    } else {
      resolve(history = [...new Set(data.split('\n').filter(x => !!x.trim()).reverse())])
    }
  })
})

const loadAllBranches = () => new Promise((resolve, reject) => {
  exec('git for-each-ref refs --format=%(refname:short)', (error, stdout, stderr) => {
    if (error) {
      allBranches = []
      reject(stderr)
    } else {
      resolve(allBranches = stdout.split('\n').map(x => normolize(x)).filter(x => !x.startsWith('*')))
    }
  })
})

const normolize = (branch) =>
  branch.trim().replace(/^remote\//, "").replace(remoutes, "")

const setup = () => {
}

const searchBranch = async (answers, input) => {
  if (!history || !allBranches) {
    try {
      await loadAllBranches()
    } catch (e) {
      console.error(e)
    }

    try {
      await loadHostory()
    } catch (e) {
      console.error('Can\'t find checkout history. Please use git prev setup')
    }
  }

  if (!input) {
    if (history.length) {
      return history
    } else {
      return allBranches
    }
  }

  return fuzzy.filter(input, allBranches).map(x => x.original)
}

const createPromt = (list) => {
  const promts = [{
    type: 'autocomplete',
    name: 'branch',
    message: 'Select branch',
    source: searchBranch,
    pageSize: 10
  }]

  inquirer.prompt(promts).then(({ branch }) => {
    exec(`git checkout ${branch}`, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr)
      }
    })
  })
}

const commands = { setup, createPromt }

exec('git remote', (err, stdout, stderr) => {
  if (err) {
    console.error(err)
  } else {
    remoutes = new RegExp(`^${stdout.split('\n').map(x => `${x.trim()}\/`).join('|')}`)
    showCli()
  }
})

const showCli = () => {
  const cli = meow(`
	Usage
	  $ git prev

  Examples
	  $ git prev setup
`)

  const [command = 'createPromt'] = cli.input
  if (command in commands) {
    commands[command](cli.flags)
  } else {
    cli.showHelp()
  }
}