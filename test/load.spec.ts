import test from "tape";
import { loadToml, validateConfig } from "../src/main.js";
import { parse as parseToml } from "toml";

test("Loading a complex test file", (t) => {
  interface Config {
    string: string;
    number: number;
    number_2: number;
    bool_true: boolean;
    bool_false: boolean;
    number_missing: number;
    nested: {
      nested_text: string;
      nested_number: number;
      nested_default: number;
      deeper: {
        deep_nested_text: string;
        deep_nested_number: number;
        deep_nested_bool: number;
      };
    };
  }
  // Load from file
  const rawConfig = loadToml(import.meta.url, "./config.toml");
  const config = validateConfig<Config>(
    {
      string: { type: "string" },
      number: { type: "number" },
      number_missing: { type: "number", required: false },
      number_2: { type: "number", default: 2 },
      bool_true: { type: "boolean", default: true },
      bool_false: { type: "boolean", default: true },
      nested: {
        type: "object",
        properties: {
          nested_text: { type: "string" },
          nested_number: { type: "number" },
          nested_default: { type: "number", default: 7 },
          deeper: {
            type: "object",
            properties: {
              deep_nested_text: { type: "string" },
              deep_nested_number: { type: "number" },
              deep_nested_bool: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    rawConfig,
  );
  t.is(config.string, "string");
  t.is(config.number, 1);
  t.is(config.number_missing, undefined);
  t.is(config.bool_true, true, "defaults work");
  t.is(config.bool_false, false, "overriding default true with false");
  t.is(config.nested.nested_number, 4, "works?");
  t.is(config.nested.nested_default, 7, "works?");
  t.is(config.nested.deeper.deep_nested_text, "hello", "works");
  t.is(config.nested.deeper.deep_nested_number, 42, "works");
  t.is(config.nested.deeper.deep_nested_bool, true, "works");
  t.end();
});

test("Invalid type in config", (t) => {
  interface Config {
    string: string;
  }
  const rawConfig = parseToml(`string = 4`);
  try {
    const config = validateConfig<Config>(
      {
        string: { type: "string" },
      },
      rawConfig,
    );
  } catch (err) {
    t.ok(err, "throws correctly due to invalid type");
  }
  t.end();
});

test("missing item in config", (t) => {
  interface Config {
    string: string;
  }
  const rawConfig = parseToml(`string = 4`);
  try {
    const config = validateConfig<Config>(
      {
        string: { type: "string" },
      },
      rawConfig,
    );
  } catch (err) {
    t.ok(err, "throws correctly due to invalid type");
  }
  t.end();
});
