import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parse as parseToml } from "toml";
import * as regex from "./regex.js";

type ScalarType = "string" | "boolean" | "number";
type RealType = string | boolean | number;

interface BaseSchemaOption {
  required?: boolean;
}

export interface ScalarSchemaOption extends BaseSchemaOption {
  type: ScalarType;
  default?: unknown;
  secret?: boolean;
}

export interface FormattedStringSchemaOption extends ScalarSchemaOption {
  type: "string";
  format: "url" | "http" | "https" | "email";
}

interface ObjectSchemaOption extends BaseSchemaOption {
  type: "object";
  properties: Record<string, SchemaOption>;
  default?: Record<string, unknown>;
}

type SchemaOption =
  | ScalarSchemaOption
  | FormattedStringSchemaOption
  | ObjectSchemaOption;

export type Schema = Record<string, SchemaOption>;

type InferSchemaType<T extends SchemaOption> = T extends ScalarSchemaOption
  ? T["secret"] extends true
    ? T["required"] extends false
      ? SecretKey<InferBaseType<T>> | undefined
      : SecretKey<InferBaseType<T>>
    : T["required"] extends false
      ? InferBaseType<T> | undefined
      : InferBaseType<T>
  : T extends ObjectSchemaOption
    ? T["required"] extends false
      ?
          | {
              [K in keyof T["properties"]]: InferSchemaType<T["properties"][K]>;
            }
          | undefined
      : { [K in keyof T["properties"]]: InferSchemaType<T["properties"][K]> }
    : never;

// Helper type to infer base types
type InferBaseType<T extends ScalarSchemaOption> = T["type"] extends "string"
  ? string
  : T["type"] extends "boolean"
    ? boolean
    : T["type"] extends "number"
      ? number
      : never;

export type InferConfig<T extends Schema> = {
  [K in keyof T]: InferSchemaType<T[K]>;
};

export class SecretKey<T extends RealType> {
  private static storage = new WeakMap<
    SecretKey<any>,
    string | boolean | number
  >();
  constructor(value: string | boolean | number) {
    SecretKey.storage.set(this, value);
  }
  reveal(): T {
    return SecretKey.storage.get(this) as T;
  }
  toJSON() {
    return "REDACTED";
  }
  toString() {
    "REDACTED";
  }
}

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

    if (
      schemaOption.type === "string" &&
      "format" in schemaOption &&
      schemaOption.format
    ) {
      const formatOption = schemaOption as FormattedStringSchemaOption;
      switch (formatOption.format) {
        case "url":
          if (!regex.url.test(resolvedValue)) {
            throw new Error(`${resolvedValue} must be of format url`);
          }
          break;
        case "http":
          if (!regex.http.test(resolvedValue)) {
            throw new Error(`${resolvedValue} must be of format http or https`);
          }
          break;
        case "https":
          if (!regex.https.test(resolvedValue)) {
            throw new Error(
              `${resolvedValue} must be of format https (secure)`,
            );
          }
          break;
        case "email":
          if (!regex.email.test(resolvedValue)) {
            throw new Error(`${resolvedValue} must be of format http`);
          }
          break;
        default:
          throw new Error(
            `Invalid format ${formatOption.format} for string config item`,
          );
      }
    }

    let secret;
    if ("secret" in schemaOption && schemaOption.secret) {
      secret = new SecretKey(resolvedValue);
    }

    return { ...acc, [key]: secret ? secret : resolvedValue };
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
