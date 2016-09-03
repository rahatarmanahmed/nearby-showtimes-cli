#!/usr/bin/env node
const Promise = require('bluebird')
const Showtimes = require("showtimes")
const _ = require('lodash')
const chalk = require('chalk')
const chrono = require('chrono-node')
const moment = require('moment')
const triangulate = Promise.promisify(require('wifi-triangulate'))

var argv = require('yargs')
.usage('Usage: $0 [zip|coordinates|location]')
.alias('n', 'num-theaters')
.number('n')
.describe('n', 'Number of nearest theaters to get')
.default('n', 3)
.alias('d', 'date')
.describe('d', 'Date to search (natural language)')
.default('d', 'Today')
.help('h')
.argv

Promise.promisifyAll(Showtimes.prototype)

async function getShowtimes(location, date) {
  const days = moment(date).startOf('day').diff(moment().startOf('day'), 'days')
  const s = new Showtimes(location, { date: days })

  const closestTheaters = (await s.getTheatersAsync()).slice(0, argv.n).map(t => t.id)

  let movies = await s.getMoviesAsync()
  movies.forEach(m => m.theaters = m.theaters.filter(t => _.includes(closestTheaters, t.id)))
  movies = movies.filter(m => m.theaters.length)

  movies.forEach(m => {
    console.log(chalk.bgWhite.black.bold(` ${m.name} `))
    m.theaters.forEach(t => {
      console.log('\t' +chalk.gray(t.name))
      console.log('\t\t' + t.showtimes.join('  '))
    })
    console.log()
  })
}

var dateResults = chrono.parse(argv.d)
if(!dateResults.length) {
    console.log(`Was not able to parse a date from "${argv.d}"`)
    process.exit(1)
}

if(argv._[0]) {
  getShowtimes(argv._[0], dateResults[0].start.date())
}
else {
  triangulate()
  .then(
      loc => getShowtimes(`${loc.lat},${loc.lng}`),
      err => {
          console.error('Failed to automatically get location. Please run command with an explicit location.')
          process.exit(1)
      })
}
