#!/usr/bin/env node
import path from 'path'
import babel from '@babel/core'
import { generateTypes } from './generator'

const inputFile = process.argv[2]

if (!inputFile) {
  console.log('Usage: orbit-type-generator FILE')
  process.exit(1)
}

const absPath = path.resolve(process.cwd(), inputFile)
const transpiled = babel.transformFileSync(absPath, {
  plugins: ['@babel/plugin-transform-modules-commonjs']
})?.code

if (transpiled) {
  const schema = eval(transpiled)

  console.log(generateTypes(schema))
} else {
  throw new Error('No transpiled result!')
}
