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
      password: { type: 'string', secret: true, required: false },
    }
  },
};
// Load config.toml from relative path to current file
const rawConfig = loadToml(import.meta.url, './config.toml');
export const config = validateConfig(schema, rawConfig);
```

## Secret keys
To help prevent revealing keys, config items marked as `secret` in the schema will instantiate a SecretKey class instead of hte corresponding scalar value. The value is not stored with the secret itself, and is only accessible via `SecretKey.reveal()`. Accessing the key directly will show the SecretKey object, so hopefully will throw a type error for you when trying to use it.

In the example above, the `database.password` is labelled `secret`. Accessing it is done with `config.database.password.reveal()`.

## String format validation
The 'string' schema option optionally takes a `format` attribute. The following formats are allowed:
`email`: valid email (n.b. see src/regex.ts)
`http`: http or https url
`https`: https only url
`url`: qualified urls with a tld (e.g. example.com, n.b. localhost will not pass)

## Limitations
- There is currently no support for arrays. PRs welcome.

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
