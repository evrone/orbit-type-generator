import ts = require('typescript')
import { Schema, RelationshipDefinition } from '@orbit/data'
import { Dict } from '@orbit/utils'
import {
  getTemplate,
  toPascalCase,
  toRelativePath,
  pipe,
  resolvePath,
  validatePath,
  toForwardSlash,
  stripExtension,
  addDotSlash
} from './utils'
import {
  ModelDefinition,
  AttributeDefinition,
  ImportDeclaration
} from './types'
import { resolveType } from './typeResolver'

let typeImports: ImportDeclaration[]

interface GenerateTypesOptions {
  basePath?: string;
  extraImports?: ImportDeclaration[];
  tsProperty?: keyof AttributeDefinition;
}

export function generateTypes (
  schema: Schema,
  options: GenerateTypesOptions = {}
): string {
  // Reset type imports
  typeImports = []

  // We need to call generateRecordTypes first so type imports can be added dynamically.
  const recordTypes = generateRecordTypes(schema.models, options)
  const statements = [generateHeader(options), recordTypes]
  const resultFile = ts.createSourceFile(
    'records.d.ts',
    statements.join(''),
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  )
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  })

  return printer.printFile(resultFile)
}

function generateHeader (options: GenerateTypesOptions): string {
  return [
    getTemplate('header'),
    generateImports(options),
    getTemplate('generics')
  ].join('\n')
}

function generateImports (options: GenerateTypesOptions): string {
  const basePath = options.basePath || process.cwd()
  const extraImports = options.extraImports || []
  const imports = [...typeImports, ...extraImports]

  if (!imports || imports.length === 0) {
    return ''
  }

  function transform ({ modulePath, ...rest }: ImportDeclaration): ImportDeclaration {
    const pipeline = pipe(
      (_path: string) => resolvePath(modulePath, basePath),
      validatePath,
      (_path: string) => toRelativePath(basePath, modulePath),
      stripExtension,
      toForwardSlash,
      addDotSlash
    )

    return {
      modulePath: pipeline(modulePath),
      ...rest
    }
  }

  return imports
    .map(transform)
    .reduce(combineImports, [])
    .map(({ type, modulePath }) => getTemplate('import', [type, modulePath]))
    .join('\n')
}

function combineImports (
  newDeclarations: ImportDeclaration[],
  declaration: ImportDeclaration
): ImportDeclaration[] {
  const existingModuleIndex = newDeclarations.findIndex(
    ({ modulePath }) => modulePath === declaration.modulePath
  )

  if (existingModuleIndex > -1) {
    newDeclarations[existingModuleIndex] = {
      type: `${newDeclarations[existingModuleIndex].type}, ${declaration.type}`,
      modulePath: declaration.modulePath
    }
  } else {
    newDeclarations.push(declaration)
  }

  return newDeclarations
}

function tryAddTypeToImports (type: string): boolean {
  const resolved = resolveType(type)

  if (resolved) {
    typeImports.push(resolved)
    return true
  } else {
    console.warn(`Could not import type ${type}`)
    return false
  }
}

function generateRecordTypes (
  models: Schema['models'],
  options: GenerateTypesOptions
): string {
  return Object.entries(models)
    .map(([name, definition]) => {
      return generateRecordType(name, definition, options)
    })
    .join('\n')
}

function generateRecordType (
  name: string,
  definition: ModelDefinition,
  options: GenerateTypesOptions
): string {
  let attributesIdentifier = 'undefined'
  let relationshipIdentifier = 'undefined'
  let attributes = ''
  let relationships = ''

  if (definition.attributes) {
    attributes = generateAttributes(name, definition.attributes, options)
    attributesIdentifier = `${toPascalCase(name)}Attributes`
  }

  if (definition.relationships) {
    relationships = generateRelationships(name, definition.relationships)
    relationshipIdentifier = `${toPascalCase(name)}Relationships`
  }

  const model = getTemplate('record', [
    name,
    toPascalCase(name),
    toPascalCase(name),
    attributesIdentifier,
    relationshipIdentifier
  ])

  const identity = generateIdentity(name)

  return [model, identity, attributes, relationships].join('\n')
}

function generateIdentity (name: string): string {
  return getTemplate('identity', [toPascalCase(name), name])
}

function startsWithCapital (string: string): boolean {
  const firstChar = string[0]
  if (!firstChar) {
    throw new Error('Type should not be an empty string')
  }

  return firstChar === firstChar.toUpperCase()
}

function generateAttributes (
  name: string,
  attributes: Dict<AttributeDefinition>,
  options: GenerateTypesOptions
): string {
  const tsProperty: keyof AttributeDefinition = options.tsProperty || 'type'
  const attributeList = Object.entries(attributes)
    .map(([name, definition]) => {
      let type
      // Find TS declaration for type
      const tsType = definition[tsProperty] as string | undefined
      if (tsType && startsWithCapital(tsType) && tryAddTypeToImports(tsType)) {
        type = tsType
      }

      // Map to regular types
      if (typeof type === 'undefined') {
        switch (definition.type) {
          case 'string':
            type = 'string'
            break
          case 'float':
          case 'integer':
          case 'number':
          case 'numeric':
            type = 'number'
            break
          default:
            type = 'any'
        }
      }

      return `${name}: ${type}`
    })
    .join('\n')

  return getTemplate('attributes', [toPascalCase(name), attributeList])
}

function generateRelationships (
  name: string,
  relationships: Dict<RelationshipDefinition>
): string {
  const relationshipList = Object.entries(relationships)
    .map(([name, definition]) => {
      let type

      // A relationship type is required.
      switch (definition.type) {
        case 'hasOne':
          type = 'RecordHasOneRelationship'
          break
        case 'hasMany':
          type = 'RecordHasManyRelationship'
          break
      }

      // A relationship model is optional.
      if (typeof definition.model === 'string') {
        type += `<${toPascalCase(definition.model)}RecordIdentity>`
      }
      // TODO: definition.model may be a string[]

      return `${name}: ${type}`
    })
    .join('\n')

  return getTemplate('relationships', [toPascalCase(name), relationshipList])
}
