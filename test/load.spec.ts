import test from "tape";
import { loadToml, validateConfig } from "../src/main.js";
import { parse as parseToml } from "toml";

test("Loading a complex test file", (t) => {
  // Load from file
  const rawConfig = loadToml(import.meta.url, "./config.toml");
  const config = validateConfig(
    {
      string: { type: "string" },
      email: { type: "string", format: "email" },
      http: { type: "string", format: "http" },
      https: { type: "string", format: "http" },
      https_required: { type: "string", format: "http" },
      url: { type: "string", format: "url" },
      number: { type: "number" },
      number_missing: { type: "number", required: false },
      number_2: { type: "number", default: 2 },
      bool_true: { type: "boolean", default: true },
      bool_false: { type: "boolean", default: true },
      secret_number: { type: "number", secret: true },
      secret_string: { type: "string", secret: true },
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
    } as const,
    rawConfig,
  );
  t.is(config.string, "string");
  t.is(config.number, 1);
  t.is(config.number_missing, undefined);
  t.is(config.non_extant, undefined, "Values not defined at all are undefined");
  t.is(config.bool_true, true, "defaults work");
  t.is(config.bool_false, false, "overriding default true with false");
  t.is(config.nested.nested_number, 4, "works?");
  t.is(config.nested.nested_default, 7, "works?");
  t.is(config.nested.deeper.deep_nested_text, "hello", "works");
  t.is(config.nested.deeper.deep_nested_number, 42, "works");
  t.is(config.nested.deeper.deep_nested_bool, true, "works");
  t.is(typeof config.secret_number, "object");
  t.is(config.secret_number.reveal(), 123);
  t.is(typeof config.secret_string, "object");
  t.is(config.secret_string.reveal(), "password");
  console.log(config);
  t.end();
});

test("Invalid type in config", (t) => {
  const rawConfig = parseToml(`string = 4`);
  try {
    const config = validateConfig(
      {
        string: { type: "string" },
      } as const,
      rawConfig,
    );
  } catch (err) {
    t.ok(err, "throws correctly due to invalid type");
  }
  t.end();
});

test("missing item in config", (t) => {
  const rawConfig = parseToml(`string = 4`);
  try {
    const config = validateConfig(
      {
        string: { type: "string" },
      } as const,
      rawConfig,
    );
  } catch (err) {
    t.ok(err, "throws correctly due to invalid type");
  }
  t.end();
});

const badFormatting = (format: String, badValue: string) =>
  test(`bad ${format} formatting`, (t) => {
    const rawConfig = parseToml(`bad_${format} = "${badValue}"`);
    try {
      validateConfig(
        {
          [`bad_${format}`]: { type: "string", format: format },
        } as const,
        rawConfig,
      );
    } catch (err) {
      t.ok(err, `throws correctly due to invalid string ${format}`);
    }
    t.end();
  });

badFormatting("email", "a$a.com");
badFormatting("http", "ftp://whatever.com");
badFormatting("http", "ftp");
badFormatting("https", "http://whatever.com");
badFormatting("https", "foobar");
badFormatting("url", "foobar z zzxczx");
