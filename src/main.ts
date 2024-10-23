import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parse as parseToml } from "toml";

type ScalarType = "string" | "boolean" | "number";

interface BaseSchemaOption {
  required?: boolean;
}

export interface ScalarSchemaOption extends BaseSchemaOption {
  type: ScalarType;
  default?: unknown;
}

interface ObjectSchemaOption extends BaseSchemaOption {
  type: "object";
  properties: Record<string, SchemaOption>;
  default?: Record<string, unknown>;
}

type SchemaOption = ScalarSchemaOption | ObjectSchemaOption;

export type Schema = Record<string, SchemaOption>;

type InferSchemaType<T extends SchemaOption> = T extends ScalarSchemaOption
  ? T["type"] extends "string"
    ? T["required"] extends false
      ? string | undefined
      : string
    : T["type"] extends "boolean"
      ? T["required"] extends false
        ? boolean | undefined
        : boolean
      : T["type"] extends "number"
        ? T["required"] extends false
          ? number | undefined
          : number
        : never
  : T extends ObjectSchemaOption
    ? T["required"] extends false
      ?
          | {
              [K in keyof T["properties"]]: InferSchemaType<T["properties"][K]>;
            }
          | undefined
      : { [K in keyof T["properties"]]: InferSchemaType<T["properties"][K]> }
    : never;

export type InferConfig<T extends Schema> = {
  [K in keyof T]: InferSchemaType<T[K]>;
};

/**
 * @param schema: A schema to ensure all values are accounted for
 * @param config: arbitrary object
 * @returns validated config object
 */
export function validateConfig<T extends Schema>(
  schema: T,
  config: any = {},
): InferConfig<T> {
  const parsed = Object.keys(schema).reduce((acc, key) => {
    const schemaOption = schema[key];
    const inputValue = config[key];

    if (
      inputValue === undefined &&
      schemaOption.required !== false &&
      !("default" in schemaOption)
    ) {
      throw new Error(`Config item ${key} not found. Invalid inputConfig`);
    }

    const resolvedValue =
      inputValue !== undefined ? inputValue : schemaOption.default;

    if (schemaOption.type === "object" && typeof resolvedValue === "object") {
      return {
        ...acc,
        [key]: validateConfig(schemaOption.properties, resolvedValue),
      };
    }

    if (
      typeof resolvedValue !== schemaOption.type &&
      resolvedValue !== undefined
    ) {
      throw new Error(
        `Config item ${key} has invalid type. Received ${typeof resolvedValue}, expecting ${schemaOption.type}`,
      );
    }

    return { ...acc, [key]: resolvedValue };
  }, {} as InferConfig<T>);

  return parsed;
}

/**
 *
 * @param baseUrl use import.meta.url (modules) or `file://${__dirname}` (commonjs)
 * @param relativePath relative path to resolved baseUrl (i.e. the file you are using now)
 * @returns unvalidated config object
 */
export function loadToml(baseUrl: string, relativePath: string) {
  const thisDir = dirname(fileURLToPath(baseUrl));
  const configFileString = readFileSync(
    join(thisDir, relativePath),
    "utf8",
  ).toString();
  const rawConfig = parseToml(configFileString);
  if (typeof rawConfig !== "object") {
    throw new Error("Loaded toml file expected to be parsed as toml");
  }
  if (rawConfig === null) {
    throw new Error("Loaded toml file expected to be parsed as toml");
  }
  return rawConfig;
}
