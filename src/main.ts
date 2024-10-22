import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parse as parseToml } from "toml";

interface ScalarSchemaOption {
  default?: string | boolean | number;
  required?: boolean;
  type: "string" | "boolean" | "number";
}

interface SchemaObjectOption
  extends Omit<ScalarSchemaOption, "type" | "properties" | "default"> {
  type: "object";
  default?: Record<string, SchemaOption>;
  properties: Record<string, SchemaOption>;
}

type SchemaOption = ScalarSchemaOption | SchemaObjectOption;
/**
 * @param schema A schema to ensure all values are accounted for
 * @param inputConfig
 * @returns validatedConfig file
 * N.b.: No strict type enforcement, only existence (assumed by interface!)
 */
export function validateConfig<T>(
  schema: Record<keyof T, SchemaOption>,
  inputConfig: any = {},
): T {
  const parsed = (Object.keys(schema) as Array<keyof T>).reduce((acc, key) => {
    const defaultParam = schema[key].default;
    if (
      !Object.hasOwnProperty.call(inputConfig, key) &&
      !Object.hasOwnProperty.call(schema[key], "default") &&
      schema[key].required !== false
    ) {
      throw new Error(
        `Config item ${String(key)} not found. Invalid inputConfig`,
      );
    }
    const resolvedConfig = inputConfig[key] ?? defaultParam;
    if (typeof resolvedConfig !== schema[key].type) {
      if (!resolvedConfig && schema[key].required === false) {
        // Undefined but not required
      } else {
        // Bad type and required
        throw new Error(
          `Config item ${String(key)} has invalid type. Received ${typeof resolvedConfig}, expecting ${schema[key].type}`,
        );
      }
    }
    if (schema[key].type === "object") {
      const parsed = validateConfig<any>(
        schema[key].properties,
        resolvedConfig,
      );
      return { [key]: parsed, ...acc };
    }
    return { [key]: resolvedConfig ?? defaultParam, ...acc };
  }, {});
  return parsed as T;
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
