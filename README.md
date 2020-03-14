# @evrone/orbit-type-generator

[![npm](https://img.shields.io/npm/v/@evrone/orbit-type-generator.svg)](https://www.npmjs.com/package/@evrone/orbit-type-generator)
[![Travis](https://img.shields.io/travis/evrone/orbit-type-generator.svg)](https://travis-ci.org/evrone/orbit-type-generator)
[![Codecov](https://img.shields.io/codecov/c/github/evrone/orbit-type-generator.svg)](https://codecov.io/gh/evrone/orbit-type-generator)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/evrone/orbit-type-generator.svg)](https://codeclimate.com/github/evrone/orbit-type-generator)

> [TypeScript](https://www.typescriptlang.org/) type generator for [Orbit](https://orbitjs.com/) schema definitions.
>
> Fork of https://github.com/exivity/react-orbitjs/tree/next/packages/orbit-type-generator

Feel free to start watching and ⭐ project in order not miss the release or updates.

<a href="https://evrone.com/?utm_source=orbit_type_generator">
  <img src="https://user-images.githubusercontent.com/417688/34437029-dbfe4ee6-ecab-11e7-9d80-2b274b4149b3.png"
       alt="Sponsored by Evrone" width="231">
</a>

## API

### `generateTypes(schema: Schema): string`

Example use case:

```js
import { generateTypes } from 'orbit-type-generator'

const definition = {
  models: {
    user: {
      attributes: {
        username: { type: 'string' }
      },
      relationships: {
        group: { type: 'hasOne', model: 'group' }
      }
    },
    group: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        users: { type: 'hasMany', model: 'user' }
      }
    }
  }
}
const schema = new Schema(definition)

generateTypes(schema)
```

Would returns this string:

```ts
// some statements omitted for brevity
export interface UserRecord extends Record, UserRecordIdentity {
    attributes?: UserAttributes;
    relationships?: UserRelationships;
}
export interface UserRecordIdentity extends RecordIdentity {
    type: "user";
    id: string;
}
export interface UserAttributes extends Dict<any> {
    username: string;
}
export interface UserRelationships extends Dict<RecordRelationship> {
    group: RecordHasOneRelationship<GroupRecordIdentity>;
}
export interface GroupRecord extends Record, GroupRecordIdentity {
    attributes?: GroupAttributes;
    relationships?: GroupRelationships;
}
export interface GroupRecordIdentity extends RecordIdentity {
    type: "group";
    id: string;
}
export interface GroupAttributes extends Dict<any> {
    name: string;
}
export interface GroupRelationships extends Dict<RecordRelationship> {
    users: RecordHasManyRelationship<UserRecordIdentity>;
}
```

## CLI

If you have a file `schema.js`:

```js
export default {
  models: {
    user: {
      attributes: {
        username: { type: 'string' }
      }
    }
  }
}
```

you can generate the types with:

```bash
orbit-type-generator schema.js > models.d.ts
```

## Advanced

### Using TypeScript types

You can type attributes using TypeScript types or interfaces.
The generator will automatically import the type based on a resolved
`tsconfig.json` in the directory you're executing from.

```js
const definition = {
  models: {
    user: {
      attributes: {
        permission: { type: 'UserPermission' }
      }
    }
  }
}
```

You can optionally specify a fallback type to use if TypeScript can't resolve
the specified type:

```js
const definition = {
  models: {
    user: {
      attributes: {
        permission: { type: 'string', ts: 'UserPermission' }
      }
    }
  }
}

const schema = new Schema(definition)
const types = generateTypes(schema, { tsProperty: 'ts' })
```

### Specify a different base directory

If you want your imports to be relative to a different directory than the
directory you're executing from, use:

```js
const types = generateTypes(schema, {
  basePath: path.resolve(__dirname, 'src')
})
```

## Todo

- [x] Properly generate types for relationships
- [ ] Option to allow extra properties (toggle attr/rel extends statements)
- [ ] Support .ts files in CLI using on-the-fly compiling

## Contributing

If you want to get involved, please do so by
[creating issues](https://github.com/evrone/orbit-type-generator/issues/new) or submitting pull requests.
Before undertaking any major PR effort, **please** check the existing
([open and closed](https://github.com/evrone/orbit-type-generator/issues?q=is%3Aissue)) issues.
If there isn't one, please file a new issue so we can discuss and assign the work so effort is not duplicated.
Thank you!

#### If you need make PR

+ Use `yarn` and tasks from [package.json](/package.json).
+ Write tests for you changes, obvious and covering.
