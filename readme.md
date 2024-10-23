# toml-config

A simple, package for loading & validating toml files and validating against a schema, with static type inference. Useful for configuration app deployments in a 12-factor environment. Only dependency is toml. Properties not present in schema are discarded.

Both ESM & CJS versions published.

## Schema definition
- string
- number
- object type supports nested schemas

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
export const config = validateConfig(schema, rawConfig);
```

## Loading toml in CJS environment using helper

```typescript
// Relative path to current file
const rawConfig = loadToml(`file://${__dirname}`, './config.toml');
```
