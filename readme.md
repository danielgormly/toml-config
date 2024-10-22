# toml-config

A simple, typed package for loading & validating configuration from toml files and validate against a schema. Useful for 12-factor deployments. Only dependency is toml-parser. Toml properties not present in schema are discarded.

ESM & CJS versions compiled.

## Schema definition
- string
- number
- object type supports nested schemas

# Drawbacks
There is no static type inference on the validator to avoid complexity & dependencies. Therefore config type must be manually typed. Type mistakes therefore are possible in consumption of config. Use [toml](https://www.npmjs.com/package/toml) + [zod](https://zod.dev/), [suretype](https://github.com/grantila/suretype) etc to construct a fully type-safe version yourself. I run many commercial services on this model, avoiding nested config and find this level of safety adequate.

## Installing
```bash
npm install toml-config
```

## Usage
Write a schema, output config type, load toml file, validate & export.

**config.toml**
```toml
environment = "test"
[database]
host = 'localhost'
port = 5432
```

**config.ts**
```typescript
import { loadToml, validateConfig } from 'toml-config';
// n.b. config is manually typed and only compared that top-level properties are present.
interface Config {
  environment: string
  database: {
    host: string,
    port: number,
    username: string,
    password?: string,
  }
}
const schema = {
  string: { type: 'string' },
  database: {
    type: 'object',
    properties: {
      host: { type: 'localhost' },
      port: { type: 'number' },
      username: { type: 'string', default: 'admin' },
      password: { type: '', required: false },
    }
  },
};
// Load config.toml from relative path to current file
const rawConfig = loadToml(import.meta.url, './config.toml');
export const config = validateConfig<Config>(schema);
```

## Loading toml in CJS environment using helper

```typescript
// Relative path to current file
const rawConfig = loadToml(`file://${__dirname}`, './config.toml');
```
