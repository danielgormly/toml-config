import { expectType } from "tsd";
import { Schema, InferConfig, SecretKey } from "../src/main.js";

/** To be run with tsc --noEmit */
const schema = {
  foo: { type: "number" },
  bar: { type: "string" },
  secret: { type: "string", secret: true },
} satisfies Schema;

type ExpectedConfig = {
  foo: number;
  bar: string;
  secret: SecretKey<string>;
};

type Config = InferConfig<typeof schema>;

const config: Config = {
  foo: 6,
  bar: "bo",
  secret: new SecretKey<string>("yo"),
};

expectType<ExpectedConfig>(config);
