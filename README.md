
engage
======

Incremental build tool with automatic dependency tracking. Very alpha.


Principles
----------

* **Incremental**: engage knows what has been done, so it doesn't need
  to do it again. You change one file, it recompiles one file.

* **Fast**: because, see above.

* **Easy**: engage's API is simple and does not require any novel
  concepts. `engage` lets you *do the naive thing* and get away with
  it.

* **No frivolous plugins**: any function that operates a source to
  source transform can just be used directly.



Examples
--------

### Compiling Markdown files

Here is how you would compile all the `.md` files in `./content` to
`.html` files in `./out`:

```javascript
var engage = require("engage");
var marked = require("marked");

var rootPath = "./content"
var outPath = "./out"

var tMarkdown = engage.task(function () {
    this.get(this.rootPath).find("**/*.md").map(function (file) {
        destination = this.renameOut(file, {extension: ".html"})
        this.log("Writing file: " + destination.path);
        destination.write(marked(file.text));
    });
});

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath,
    log: console.log
};

engage(tMarkdown, opts).run();
```

And here's **what you gain**:

* `engage.task` and `map` track all reads and all file changes so that
  work can be minimized:
  * Modify a Markdown file and only that file will be recompiled.
  * Add a Markdown file and it will be compiled along the others.
  * You can also add new directories, and so on.

* There is no `engage-marked` package. There is no need for one. The
  `marked` function takes a string and returns a string and that's all
  you need. Now you can take this code and adapt it to any compiler!
  No need to wait for someone else to do it for you!
  * Things *do* get more complicated if a compiler reads dependencies,
    because if you want `engage` to track them, you need `engage` to
    resolve them.

* Deriving the output file from the source file is made super easy by
  the `Renamer` class:
  * `Renamer({from: "abc", to: "xyz"})` swaps the "abc" base for "xyz".
  * `Renamer({rebase: {"abc": "xyz"})` does the same thing, but you can
    define more than one rebase.
  * `Renamer({extension: ".hello"})` swaps the extension for another.
  * All options can be given in the constructor *and/or* in the `rename`
    method.
  * *You* define your renamer. You can even give it the name you want.

Also note that logging is your responsibility. You can use whatever
logger you want (`console.log` is the default).
  

### Concatenation

This task demonstrates concatenation of many files (more specifically,
`contents/root/**/*.cat` will be concatenated and saved as a file with
the same name as the directory; in this case that would be
`out/root`). The boilerplate is almost identical to the previous
example, so focus mainly on `tCat` and `tMain`.

```javascript
var engage = require("engage");

var tCat = engage.task(function(root) {
    var filesContents = root.find("**/*.cat").map(function (file) {
        this.log("Read " + file.path);
        return file.text;
    });
    var dest = this.renameOut(root);
    this.log("Write " + dest.path);
    dest.write(filesContents.join(""));
});

var tMain = task(function () {
    var root = this.get(this.rootPath);
    tCat(root.get("partsA"));
    tCat(root.get("partsB"));
});

var rootPath = "./content"
var outPath = "./out"

opts = {
    renameOut: Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath
};

engage(tMain, opts).run();
```

There are a few additional features demonstrated:

* We can use `map` to build our array of strings to concatenate. But
  beware: mutation and side-effects should **not** be used in the
  function you give to `map`.

* Because of the use of `map`, if you change one of the files that are
  being concatenated, `engage` will only re-read that file. This is
  not very interesting in this case because reading a file is very
  cheap, but if the task was more expensive, it would cache and re-use
  the result.

* Adding and removing `.cat` files will redo the concatenation -- as
  you would expect.

* The task `tCat` is called by the task `tMain` twice. This is how you
  compose tasks, and it will work exactly as expected.



Tasks
-----

### Definition

A *task* is any function wrapped in a call to:

* `engage.task(__task__)`
* `find(...).map(__task__)`

A task is the granularity at which engage operates: engage tracks
every file every task reads, and when one of them is modified, the
associated tasks are re-run.

This means you can control the granularity of recompilation by
choosing how you break down the work into tasks. Usually, the more the
better.


### Discipline

In order for a task to work properly there are a few rules to follow:

* A task must execute synchronously.

* The _only side-effects a task should have are writing to the
  filesystem or logging. That's what `engage` is built to handle. This
  being said: do __not mutate data in a task: do _not modify fields in
  objects, do _not push data in arrays, and so on. I'm not saying it
  _won't work, but with all the re-executing and caching of tasks
  there are a lot of things that could go wrong.



Limitations
-----------

Here's what `engage` **will not do**:

* In most cases, removing a file will *not* clean up the output. For
  instance, if you compile `xyz.foo` into `xyz.bar` and delete
  `xyz.foo`, `xyz.bar` will remain behind. It would be a bit tricky to
  make a cleaning task at the moment, although you can always do it
  the old-fashioned way (and by old-fashioned way I mean `rm -rf`).

* `engage` *cannot* run tasks asynchronously because of the way it
  tracks what tasks change what parts of the filesystem (async will
  confuse it). You *can* return Promises, but `engage` will await on
  the result before proceeding any further.

* `engage` will restart the generation anew on every execution. I am
  planning to add a caching system (opt-in) so that builds can be
  incremental from an execution to the next.

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
    
task t-cat(root) =
   results = root.find("**/*.cat").map with file ->
      @log('Reading {file.path}')
      file.text
   dest = @rename(root)
   @log('Write {dest.path}')
   dest.write(results.join(""))

task t-markdown(root) =
   root.find("**/*.md").map with file ->
      dest = @rename(file, extension = ".html")
      @log('Compile {file.path} -> {dest.path}')
      dest.write(marked(file.text))

task t-main() =
   root = @get(@root-path)
   t-cat(root.get("partsA"))
   t-cat(root.get("partsB"))
   t-markdown(root)

root-path = "./content"
out-path = "./out"

opts = {
    debounce = 10
    rename = Renamer(from = root-path, to = out-path)
    root-path = root-path
    out-path = out-path
}

engage(t-main, opts).run()
```
