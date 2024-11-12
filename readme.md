# toml-config

[![CI](https://github.com/danielgormly/toml-config/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/danielgormly/toml-config/actions/workflows/ci.yml)

A simple, package for loading & validating toml files and validating against a schema, with static type inference so the resulting config item is typed. Useful for configuration files for app deployments in 12-factor style. Only dependency is toml. Properties not present in schema are discarded.

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
environment = "dev"
email = "test@example.com"
[database]
host = 'localhost'
port = 5432
```

**config.ts**
```typescript
import { loadToml, validateConfig } from 'toml-config';
const schema = {
  environment: { type: 'string' },
  email: { type: 'string', format: 'email' },
  database: {
    type: 'object',
    properties: {
      host: { type: 'string' },
      port: { type: 'number' },
      username: { type: 'string', default: 'admin' },
      password: { type: 'string', required: false },
    }
  },
};
// Load config.toml from relative path to current file
const rawConfig = loadToml(import.meta.url, './config.toml');
export const config = validateConfig(schema, rawConfig);
```

## String format validation
The 'string' schema option optionally takes a `format` attribute. The following formats are allowed:
`email`: valid email (n.b. see src/regex.ts)
`http`: http or https url
`https`: https only url
`url`: qualified urls with a tld (e.g. example.com, n.b. localhost will not pass)

## Loading toml in CJS environment using helper

```typescript
// Relative path to current file
const rawConfig = loadToml(`file://${__dirname}`, './config.toml');
```

## Inferring a type from the schema separately
You may want to do this to include the schema in functions later.

```typescript
import { Schema, InferConfig } from 'toml-config';
const schema = {
  foo: { type: "number" },
  bar: { type: "string" },
} satisfies Schema;

type Config = InferConfig<typeof schema>;

const config = {
  foo: 6,
  bar: "bo",
};

function func(config: Config) { // satisfies
  console.log(config);
}
func(config);
```
