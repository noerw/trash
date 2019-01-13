#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { compile as compileTemplate } from 'handlebars'
import * as csvParse from 'csv-parse/lib/sync'
import * as program from 'commander'

// initialize CLI parser
program
  .version('0.1.0')
  .option('-i, --input [path]', 'CSV input')
  .option('-o, --output [path]', 'Output file. If omitted, result is printed to stdout')
  .option('-d, --delimiter [delim]', 'CSV delimiter', ',')
  .option('-f, --format [format]', 'Output format (TODO: support SparQL insert statements', 'turtle')
  .option('-v, --verbose', 'Increased logging verbosity', false)
  .parse(process.argv)

if (!program.input) {
  console.error('error: param --input required\n')
  program.help()
}

// name mapping between --format parameter and template files
const TEMPLATES = {
  'turtle': __dirname + '/template_observation.turtle.handlebars',
}

const PHENOMENONS: PhenomenonDefinition = {
  'GEN_HH': {
    definition: 'euwaste:wastePerCapita',
    unit: 'KG_HAB',
  },
  'RCV': { // TODO
    definition: 'euwaste:recyclingRatio',
    unit: 'T',
  },
}

// read template file (to catch errors early)
const templateString = readFileSync(TEMPLATES[program.format], 'utf-8')

type PhenomenonDefinition = {
  [name: string]: {
    definition: string,
    unit: string
  }
}
type CsvSchema = {
  geo_nuts: string,
  phenomenon: 'GEN_HH' | string,
  unit: string,
  [year: string]: string // year: observed_value pairs
}

type Observation = {
  id: string,         // obs_${phenomenon}_${nuts}_${year}
  phenomenon: string, // values from PHENOMENONS
  value: string,
  unit: string,
}

type TemplateContext = {
  [year: string]: {
    [nuts: string]: Observation[]
  }
}

// read csv file (TODO: support multiple input files?)
// TODO: do some preprocessing? -> cast strings to numbers in order to coerce all values to the same unit
const csvString = readFileSync(program.input, 'utf-8')
const csvRows: CsvSchema[] = csvParse(csvString, {
  columns: true,
  delimiter: program.delimiter,
})

// extract years from csv file
const years = csvString
  .split('\n')[0]
  .split(program.delimiter)
  .filter(colname => colname.startsWith('20')) // FIXME: hacky

const nuts = csvRows
  .map(row => row.geo_nuts)
  .filter((val, i, arr) => arr.indexOf(val) === i)

if (program.verbose) {
  console.warn(`extracted years:\n  ${years}`)
  console.warn(`extracted NUTS regions:\n  ${nuts}`)
}

if (!years.length) {
  console.error('error: no years found in input file')
  process.exit(2)
}

/*
  generate our data structure to pass to handlebars template:
*/
const observations: TemplateContext = years.reduce((ctx, year) => {
  ctx[year] = {}
  for (const code of nuts) ctx[year][code] = []
  return ctx
}, {})

// extract observations from file
let observationCount = 0
for (const row of csvRows) {
  for (const year of years) {
    const { geo_nuts, phenomenon, unit } = row
    const value = row[year]

    // skip missing values
    if (value === '' || value === undefined)
      continue

    if (!geo_nuts || !phenomenon || !unit) {
      console.error('error: invalid CSV schema, one of [geo_nuts, phenomenon, unit] columns missing')
      process.exit(3)
    }

    const phenom = PHENOMENONS[phenomenon]
    if (!phenom) {
      console.error(`unknown phenomenon ${phenomenon} for row ${JSON.stringify(row)}`)
      process.exit(4)
    }

    if (phenom.unit !== unit) {
      console.warn(`unknown unit ${unit} for phenomenon ${phenomenon} in row  ${JSON.stringify(row)}`)
      continue
    }

    observations[year][geo_nuts].push({
      id: `obs_${geo_nuts}_${year}`,
      value,
      phenomenon: phenom.definition,
      unit,
    })

    observationCount++
  }
}

console.warn(`generated ${observationCount} observations from ${csvRows.length * years.length} values in ${csvRows.length} rows.`)
if (program.verbose) {
  console.warn(JSON.stringify(observations, null, 2))
}

// compile template & write to output
const outputString = compileTemplate(templateString)({
  observations,
  now: new Date().toISOString(),
})

if (program.output)
  writeFileSync(program.output, outputString)
else
  console.log(outputString)
