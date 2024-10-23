import { expectType } from "tsd";
import { Schema, InferConfig } from "../src/main.js";

/** To be run with tsc --noEmit */
const schema = {
  foo: { type: "number" },
  bar: { type: "string" },
} satisfies Schema;

type ExpectedConfig = {
  foo: number;
  bar: string;
};

type Config = InferConfig<typeof schema>;

const config: Config = {
  foo: 6,
  bar: "bo",
};

expectType<ExpectedConfig>(config);
