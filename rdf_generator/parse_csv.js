#!/usr/bin/env node

const csvParse = require('csv-parse/lib/sync')
const fs = require('fs')
const handlebars = require('handlebars')
const program = require('commander')

// initialize CLI parser
program
  .version('0.1.0')
  .option('-i, --input [path]', 'CSV input')
  .option('-o, --output [path]', 'Output file')
  .option('-d, --delimiter [delim]', 'CSV delimiter', ',')
  .option('-f, --format [format]', 'Output format (TODO: support SparQL insert statements', 'turtle')
  .parse(process.argv)

if (!program.input) {
  console.error('error: param --input required')
  process.exit(1)
}

if (!program.output) {
  console.error('error: param --output required')
  process.exit(1)
}

// name mapping between --format parameter and template files
const templates = {
  'turtle': __dirname + '/template_observation.turtle.handlebars',
}

// read template file (to catch errors early)
const templateString = fs.readFileSync(templates[program.format], 'utf-8')

// read csv file (TODO: support multiple input files?)
// TODO: do some preprocessing? -> cast strings to numbers in order to coerce all values to the same unit
// TODO: split up by phenomenon (depending on template requirements)
const csvString = fs.readFileSync(program.input, 'utf-8')
const csvRows = csvParse(csvString, {
  columns: true,
  delimiter: program.delimiter,
})

// extract years from csv file
const years = csvString
  .split('\n')[0]
  .split(program.delimiter)
  .filter(colname => colname.startsWith('20')) // FIXME: hacky


if (!years.length) {
  console.error('error: no years found in input file')
  process.exit(2)
}

const phenomenon_mapping = {
  'GEN_HH': 'iso37120:16.3',
}

// extract observations from file
const observations = []
for (const row of csvRows) {
  for (const year of years) {
    const observation_value = row[year]

    // skip missing values
    if (observation_value === '' || observation_value === undefined)
      continue

    const { geo_nuts, phenomenon, unit } = row
    if (!geo_nuts || !phenomenon || !unit) {
      console.error('error: invalid CSV schema, one of [geo_nuts, phenomenon, unit] columns missing')
      process.exit(3)
    }

    observations.push({
      geo_nuts,
      observation_id: `obs_${phenomenon}_${geo_nuts}_${year}`,
      observation_value,
      phenomenon: phenomenon_mapping[phenomenon] || 'unknown',
      unit,
      year,
    })
  }
}


// TODO: throw error for invalid schema

// compile template
const template = handlebars.compile(templateString)

const result = template({
  observations,
})

fs.writeFileSync(program.output, result)
