import util = require('util')
import fs = require('fs')
import path = require('path')
import slash = require('slash')
import camelCase = require('camelcase')

export function toPascalCase (name: string): string {
  return camelCase(name, { pascalCase: true })
}

export function getTemplate (name: string, parameters: unknown[] = []): string {
  const template = readFile(
    path.resolve(__dirname, '..', '__templates__', `${name}.template`)
  )

  return util.format(template, ...parameters)
}

export function readFile (filePath: string): string {
  return fs.readFileSync(filePath).toString()
}

export function pipe<T>(...functions: ((a: T) => T)[]): (a: T) => T {
  return arguments_ => (
    functions.reduce((argument, fn) => (
      fn(argument)
    ), arguments_)
  );
}

export function resolvePath (modulePath: string, basePath: string): string {
  return require.resolve(modulePath, { paths: [basePath] })
}

export function validatePath (pathToValidate: string): string {
  if (!fs.existsSync(pathToValidate)) {
    throw new Error(`Not a valid path: ${pathToValidate}`)
  }

  return pathToValidate
}

export function toRelativePath (from: string, to: string): string {
  return path.relative(from, to)
}

export function toForwardSlash (string: string): string {
  return slash(string)
}

export function stripExtension (string: string): string {
  const parsed = path.parse(string)

  return path.join(parsed.root, parsed.dir, parsed.name)
}

export function addDotSlash (string: string): string {
  return string === '.' ? string : `./${string}`
}

export function toPrefixedName (name: string, prefix?: string): string {
  if (prefix) {
    return `${prefix}-${name}`
  }

  return name
}
