#/!bin/bash
# Tiny script to repair mjs -> cjs (note, maybe we shouldn't be doing this with tsc...)
# https://github.com/microsoft/TypeScript/issues/54573

mv dist/cjs/main.d.mts dist/cjs/main.d.cts
mv dist/cjs/main.mjs dist/cjs/main.cjs
