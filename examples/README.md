
`engage` example gallery
========================

This directory contains several runnable examples to showcase `engage`.

Try this:

    git clone https://github.com/breuleux/engage.git
    cd engage/examples
    npm install
    node mincat/mincat.js
    ...


## Organization

Each example is organized the same way:

* `example/example.js` is the build script
* `example/contents/` contains the sources to compile
* `example/out/` will contain the build output

To run an example:

    node example/example.js

You can also run it from its own directory.

## Summary of examples

**`cat`**: concatenate all the files in a directory

**`md`**: compile Markdown files and output them using a Jade template

**`mincat`**: minify and concatenate JavaScript source files

**`mincatmap`**: minify and concatenate JavaScript source files, and
write the source map.

**`replace`**: substitute words in text files using a JSON translation
dictionary

Try to modify/add/remove files when the example is running. `engage`
will react to the changes and it will print out everything it reads or
writes to. (Note: there may be a bug related to adding and then
removing the same directory).

