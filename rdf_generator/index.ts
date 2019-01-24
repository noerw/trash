#!/usr/bin/env node

/**
 * rdfgen
 *
 * This tool generates RDF for spatio-temporal data from CSV files via handlebars
 * templates. Input CSV files need one observation per row, and columns as defined in
 * type CsvSchema.
 */


/* type definitions */

// the required column names of the input CSV files
type CsvSchema = {
  geo_nuts: string,
  phenomenon: 'GEN_HH' | string,
  unit: string,
  [year: string]: string // year: observed_value pairs
}

// datastructure containing the generated observations which is passed
// to the template engine.
type ParseState = {
  observations: ObservationList,
  years: string[],
  nuts: string[],
}

type ObservationList = {
  [year: string]: {
    [nuts: string]: Observation[]
  }
}

type Observation = {
  phenomenon: string, // uri from PhenomenonDefinition
  value: string,
}

// a PhenomenonDefinition maps the CSV phenomenon name to a valid unit string and a rdf uri
type PhenomenonDefinition = {
  [name: string]: {
    uri: string,
    allowedUnits: string[]
  }
}

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { compile as compileTemplate } from 'handlebars'
import * as csvParse from 'csv-parse/lib/sync'
import * as program from 'commander'

declare global {
  interface Array<T> {
      unique(): Array<T>;
  }
}

Array.prototype.unique = function () {
  return this.filter((val, i, arr) => arr.indexOf(val) === i)
}

/**
 * parses command line arguments into program & validates them
 */
function parseCheckParameters () {
  program
    .version('0.1.0')
    .usage('[input csv files]')
    .option('-o, --output [path]', 'Output file. If omitted, result is printed to stdout')
    .option('-d, --delimiter [delim]', 'CSV delimiter', ',')
    .option('-f, --format [format]', 'Output format (TODO: support SparQL insert statements', 'turtle')
    .option('-v, --verbose', 'Increased logging verbosity', false)
    .parse(process.argv)

  if (!program.args.length) {
    console.error('error: must specify input files!\n')
    program.help()
  }

  if (!existsSync(TEMPLATES[program.format])) {
    console.error(`error: invalid format specified, valid options are: ${Object.keys(TEMPLATES)}`)
    process.exit(1)
  }
}

/**
 * reads the input file, extracts observations from it and appends the results to the ParseState
 * @param path
 * @param parseState
 */
function parseCsvFile (filePath: string, state: ParseState): void {
  // read csv file
  const csvString = readFileSync(filePath, 'utf-8')
  const csvRows: CsvSchema[] = csvParse(csvString, {
    columns: true,
    delimiter: program.delimiter,
  })

  // extract years & regions from csv file
  const years = csvString
    .split('\n')[0]
    .split(program.delimiter)
    .filter(colname => colname.startsWith('20')) // FIXME: hacky

  const nuts = csvRows
    .map(row => row.geo_nuts)
    .unique()

  if (!years.length) {
    console.error('error: no years found in input file')
    process.exit(2)
  }

  // prepare the state.observations structure to add observations
  // for the years & nuts we extracted
  for (const year of years) {
    if (!state.observations[year])
      state.observations[year] = {}

    for (const nut of nuts) {
      if (!state.observations[year][nut])
        state.observations[year][nut] = []
    }
  }

  state.years = state.years.concat(years).unique().sort()
  state.nuts = state.nuts.concat(nuts).unique().sort()

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

      if (!phenom.allowedUnits.includes(unit)) {
        console.warn(`unknown unit ${unit} for phenomenon ${phenomenon} in row  ${JSON.stringify(row)}`)
        continue
      }

      state.observations[year][geo_nuts].push({
        value,
        phenomenon: phenom.uri,
      })

      observationCount++
    }
  }

  console.warn(`generated ${observationCount} observations from ${csvRows.length * years.length} values in ${csvRows.length} rows.`)
}

/////////////////////////////////////////////////////////////////////

// name mapping between --format parameter and template files
const TEMPLATES = {
  'turtle': __dirname + '/template_observation.turtle.handlebars',
}

// attribute mapping for the input phenomenon names
const PHENOMENONS: PhenomenonDefinition = {
  'population': {
    uri: 'euwaste:attrPopulation',
    allowedUnits: ['count'],
  },
  'GEN_HH': {
    uri: 'euwaste:attrWastePerCapita',
    allowedUnits: ['KG_HAB', 'THS_T'],
  },
  'RCV_R_E': {
    uri: 'euwaste:attrEnergyRecovery',
    allowedUnits: ['KG_HAB'],
  },
  'RCV_E': {
    uri: 'euwaste:attrEnergyRecovery',
    allowedUnits: ['THS_T'],
  },
  'RCY_M': {
    uri: 'euwaste:attrRecycling',
    allowedUnits: ['THS_T'],
  },
}

parseCheckParameters()

// parse each input file, and merge the results into `state`
const state: ParseState = {
  observations: {},
  years: [],
  nuts: [],
}

const inputFiles = program.args
for (const csvFile of inputFiles)
  parseCsvFile(csvFile, state)

if (program.verbose) {
  console.warn(JSON.stringify(state.observations, null, 2))
  console.warn(`extracted years:\n    ${state.years}`)
  console.warn(`extracted NUTS regions:\n    ${state.nuts}`)
}

// compile template & write to output
const templateString = readFileSync(TEMPLATES[program.format], 'utf-8')
const outputString = compileTemplate(templateString)({
  observations: state.observations,
  now: new Date().toISOString(),
})

if (program.output)
  writeFileSync(program.output, outputString)
else
  console.log(outputString)
