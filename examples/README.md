
`engage` example gallery
========================

This directory contains several runnable examples to showcase `engage`.

To run them, you must `git clone` the `engage` repository
(alternatively, if you already run `npm install engage`, you can find
the examples in `node_modules/engage`).

Prior to running the examples, you must run `npm install` in this
directory or in the directory for the example (all examples share the
same `package.json`).

## Organization

Each example is organized the same way:

* A JavaScript file which you run with `node example.js`
* A `contents/` directory with the sources to compile
* When the example is run, the output will be in the `out/` directory

## Summary of examples

**`cat`**: concatenate all the files in a directory

**`md`**: compile Markdown files and output them using a Jade template

**`mincat`**: minify and concatenate JavaScript source files

**`replace`**: substitute words in text files using a JSON translation dictionary

Try to modify/add/remove files when the example is running. `engage`
will react to the changes and it will print out everything it reads or
writes to. (Note: there may be a bug related to adding and then
removing the same directory).

