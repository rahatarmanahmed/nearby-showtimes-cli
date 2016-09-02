// require('babel-polyfill')
const Promise = require('bluebird')
const Showtimes = require("showtimes")
const _ = require('lodash')
const chalk = require('chalk')
const triangulate = Promise.promisify(require('wifi-triangulate'))

var argv = require('yargs')
.usage('Usage: $0 [zip|coordinates|location]')
.alias('n', 'num-theaters')
.number('n')
.describe('n', 'Number of nearest theaters to get')
.default('n', 3)
.help('h')
.argv

Promise.promisifyAll(Showtimes.prototype)

async function getShowtimes(location) {
  const s = new Showtimes(location)

  const closestTheaters = (await s.getTheatersAsync()).slice(0, argv.n).map(t => t.id)

  let movies = await s.getMoviesAsync()
  movies.forEach(m => m.theaters = m.theaters.filter(t => _.includes(closestTheaters, t.id)))
  movies = movies.filter(m => m.theaters.length)

  movies.forEach(m => {
    console.log(chalk.blue(m.name))
    m.theaters.forEach(t => {
      console.log('\t' +chalk.gray(t.name))
      console.log('\t\t' + t.showtimes.join('  '))
    })
    console.log()
  })
}

if(argv._[0]) {
  getShowtimes(argv._[0])
}
else {
  triangulate()
  .then(loc => getShowtimes(`${loc.lat},${loc.lng}`), err => console.error('Failed to automatically get location. Please run command with an explicit location.'))
}
