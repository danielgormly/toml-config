#/!bin/bash
# Tiny script to save common .js file as .cjs after compilation

mv dist/cjs/main.d.ts dist/cjs/main.d.cts
mv dist/cjs/main.js dist/cjs/main.cjs
mv dist/cjs/regex.d.ts dist/cjs/regex.d.cts
mv dist/cjs/regex.js dist/cjs/regex.cjs
