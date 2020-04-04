#!/usr/bin/env node
import path from 'path'
import * as babel from '@babel/core'
import { argv } from 'yargs';
import fs from 'fs';
import colors from 'colors';
import { generateTypes } from './generator'

const inputFile = argv._[0]
const outputFile = argv._[1]

if (!inputFile) {
  console.log('Usage: orbit-type-generator FILE')
  process.exit(1)
}

const absPath = path.resolve(process.cwd(), inputFile)
const transpiled = babel.transformFileSync(absPath, {
  plugins: ['@babel/plugin-transform-modules-commonjs']
})?.code

function getPrefixOption(): string | undefined {
  if (!argv.withPrefix) {
    return;
  }
  if (typeof argv.withPrefix === 'string') {
    return argv.withPrefix as string;
  } else {
    const warnMessage = `Types will be generated without prefix because string value has not been provided\nto --with-prefix option. Example of correct usage: --with-prefix=prefix`;
    console.log(colors.yellow(warnMessage));
  }
}

if (transpiled) {
  const schema = eval(transpiled)
  const prefix = getPrefixOption();
  const types = generateTypes(schema, { prefix })
  if (outputFile) {
    fs.writeFile(outputFile, types, error => {
      if (error) throw error
      console.log(colors.green(`\nTypes was successfully generated to ${path.resolve(process.cwd(), outputFile)}.`))
    });
  } else {
    console.log(colors.yellow('\nNo output file provided! Generated types:\n'))
    console.log(types)
  }
} else {
  throw new Error('No transpiled result!')
}
