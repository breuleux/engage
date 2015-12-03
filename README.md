
engage
======

Incremental build tool with automatic dependency tracking. Very alpha,
so expect bugs (and expect me to fix them).


Principles
----------

* **Incremental**: engage knows what has been done, so it doesn't need
  to do it again. You change one file, it recompiles one file.

* **Fast**: because, see above.

* **Easy**: engage's API is simple and does not require any novel
  concepts. `engage` lets you *do the naive thing* and get away with
  it.

* **No frivolous plugins**: any function that operates a source to
  source transform should just be used directly.



Examples
--------

The `examples/` directory gives several examples for various tasks you
might want to undertake. You are welcome to take and adapt them.

Here's a transcript of one of the examples:

### Compiling Markdown files

Task: compile all the `.md` files in `./content` to `.html` files in
`./out`:

```javascript
var engage = require("engage");
var marked = require("marked");

var rootPath = "./content";
var outPath = "./out";

var tMarkdown = engage.task(function (file) {
    var destination = this.renameOut(file, {extension: ".html"});
    this.log("Writing file: " + destination.path);
    destination.write(marked(file.text));
});

var tAllMarkdown = engage.task(function (root) {
    root.find("**/*.md").forEach(tMarkdown);
});

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath,
    clean: true
};

engage(tAllMarkdown, opts).run();
```

* `engage.task` and `mapTask` track all reads and all file changes so that
  work can be minimized:
  * Modify a `.md` file and only that file will be recompiled.
  * Add a `.md` file and it will be compiled along the others.
  * Adding, moving and deleting files and directories will work as
    expected.

* There is no `engage-marked` package. There is no need for one. The
  `marked` function takes a string and returns a string and that's all
  you need. Now you can take this code and adapt it to any compiler!
  No need to wait for someone else to do it for you!

* Deriving the output file from the source file is made easy by the
  `Renamer` class:
  * `Renamer({from: "abc", to: "xyz"})` swaps the "abc" base for "xyz".
  * `Renamer({rebase: {"abc": "xyz"}})` does the same thing, but you can
    define more than one rebase.
  * `Renamer({extension: ".hello"})` swaps an extension for another.
  * All options can be given in the constructor *and/or* in the `rename`
    method.
  * *You* define your renamer.

* The `rootPath` option determines what the main task (`tAllMarkdown`
  in the example) receives in its `root` argument. Note that this is
  equivalent to `root = this.get(this.rootPath)`. You can use
  `this.get` to open any file on the filesystem, if needed.

* The `clean` option instructs engage to delete previously generated
  files if they are not part of the output any more. engage will only
  delete files that have been written by a task. The default value for
  this option is `false`.


Tasks
-----

### Definition

A *task* is any function wrapped in a call to `engage.task`.

A task is the granularity at which engage operates: engage tracks
every file every task reads, and when one of them is modified, the
associated tasks are re-run.

This means you can control the granularity of recompilation by
choosing how you break down the work into tasks. Usually, the more the
better.


### Discipline

**IMPORTANT**

In order for a task to work properly there are a few rules to follow:

* A task must execute **synchronously**.

* The *only* side-effects a task should have are writing to the
  filesystem using the `write` method on engage's `FSNode` objects
  (see examples) or logging. That's what `engage` is built to
  handle. Do **not** mutate data in a task:
  * Do *not* modify fields in objects
  * Do *not* push data in arrays
  * Do *not* use data that may be modified by another part of the code
  * I'm not saying doing these things *won't* work, but with all the
    re-executing and caching of tasks there are a lot of things that
    could go wrong.

* **Do not nest tasks.** I mean... technically, you can... but you
  will run into strange issues if you don't know the finer points of
  how engage works. For now, I simply recommend not doing it at
  all. Define every task in module or global scope.



Limitations
-----------

Here's what `engage` **will not do**:

* `engage` *cannot* run tasks asynchronously because of the way it
  tracks what tasks change what parts of the filesystem (async will
  confuse it). You *can* return Promises, but `engage` will await on
  the result before proceeding any further.

* `engage` will restart the generation anew on every execution. I am
  planning to add a caching system (opt-in) so that builds can be
  incremental from an execution to the next.
  * For now, you can call `destination.older(source)` to check if a
    source file was modified after it was last compiled, and then only
    recompile it if that's the case. Works well in many use cases.

Be aware of these limitations and choose your tools
consequently. Incremental builds are usually pretty efficient and
benefit little from parallelism, because there is usually only one
thing to (re-)do, but of course every project has different
requirements.


Earl Grey macros
----------------

The [Earl Grey](http://earl-grey.io) language has some macro bindings
for `engage` that make it a lot more pleasant to use. Here's the
earlier example written in Earl Grey:

```earlgrey
require:
   engage -> Renamer
   marked

require-macros:
   engage -> task

task t-markdown(file) =
   dest = @rename(file, extension = ".html")
   @log('Compile {file.path} -> {dest.path}')
   dest.write(marked(file.text))

task t-markdown-all(root) =
   root.find("**/*.md").for-each(t-markdown)

root-path = "./content"
out-path = "./out"

opts = {
    debounce = 10
    rename = Renamer(from = root-path, to = out-path)
    root-path = root-path
    out-path = out-path
    clean = true
}

engage(t-markdown-all, opts).run()
```
