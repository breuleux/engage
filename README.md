
engage
======

Incremental build tool with automatic dependency tracking. Very alpha,
so expect bugs.


Principles
----------

* **Incremental**: engage knows what has been done, so it doesn't need
  to do it again. You change one file, it recompiles one file.

* **Fast**: because see above.

* **Easy**: engage's API is simple and does not require any novel
  concepts. `engage` lets you *do the naive thing* and get away with
  it.

* **No frivolous plugins**: any function that operates a source to
  source transform can just be used directly.



Examples
--------

[The examples directory](https://github.com/breuleux/engage/tree/master/examples)
gives several examples for various tasks you might want to
undertake. You are welcome to copy them and adapt them.

Here is a transcript of a simple but ubiquitous example, minifying
files and concatenating them:


### Minify/concat

```javascript
var engage = require("engage");
var minify = require("uglify-js").minify;

var tMinify = engage.task("minify", function (file) {
    return minify(file.text, {fromString: true}).code;
});

var tCat = engage.task("cat", function(content) {
    var result = content.find("**/*.js").map(tMinify).join(";");
    this.renameOut(content).get("main.js").write(result);
});

opts = {
    paths: {
        root: __dirname,
        content: "content",
        output: "out"
    }
};

engage(tCat, opts).run();
```

That is not a lot of code. Now let's see what it does for you:

* **Incremental**: `engage.task` track all reads and all file changes
  so that work can be minimized. For example, if you modify a `.js`
  file, only that file will be minified again, and if you add a new
  file, it will be compiled and packed along.

* There is no `engage-minify` package. There is no need for one. The
  `uglify-js` package already exports a `minify` function that maps a
  source string to minified source. That is all you need!
  * The code can therefore be adapted to *any* source to source
    compiler. There is no need to wait for someone to write a plugin.

* `this.renameOut` is automatically derived from `paths.content` and
    `paths.output` and will substitute the latter for the former.

* The `paths.content` option determines what the main task (`tCat` in
  the example) receives in its `content` argument.
  * This is equivalent to `content =
    this.get(this.paths.content)`. You can use `this.get` to open any
    file on the filesystem, if needed.
  * `this.get` is always relative to `paths.root`. Using `__dirname`
    is a good idea there because it makes the task relative to the
    script's location.

* The beginning and end of every task, as well as all files read and
  written by them, are logged. That way you can see what the tasks do.
  You can log more information with `this.log`.


Options
-------

First, note that all the options given in the call to `engage(task,
options)` are accessible from any task from the `this` object.

You are encouraged to define your own options!

Here are the options that have an official meaning:


### `clean`

(default: false)

The `clean` option instructs engage to delete previously generated
files if they are not part of the output any more. engage will only
delete files that have been written by a task.

engage does not clean by default.


### `debounce`

(default: 25)

Engage will re-execute tasks only after waiting until `debounce`
milliseconds since the last change to the filesystem.


### `displayFullPaths`

(default: false)

If this is true, then engage will display full paths for files read or
written to.


### `error`

The error logger. This defaults to `console.error`. This cannot be
`null`.


### `ignoreEmptyChanges`

(default: false)

If true, touching a file without changing its contents will not count
as a change that triggers recompilation.


### `log`

(Optional)

This is a function that will be given every log message. There is, of
course, a default logger.

Note that `engage` will give out instances of `engage.EngageMessage`
to tell the logger about tasks that begin or end, and files read or
written to. The `type` and `arguments` fields contain the relevant
information. You can of course call `message.toString()` to get a
decent string representation.

If `log` is false or null, then there will be no logging. That's not
good, but you can do it.


### `paths`

This object contains important paths. Three paths are recognized by
engage:

* **`root`**: should be the project root, the directory in which the
  build script is. (default: cwd)
* **`content`**: where the source files are. (no default!)
* **`out`**: where the output will be. (no default!)

If you define `content` and `out`, engage will set `this.renameOut` to
a renamer from the first to the second.

The paths are accessible from `this.paths`. Feel free to define paths
that are specific to your application.


### `show`

This is an *object* that controls what `engage` logs
automatically. The object fields are all booleans, and they are:

* **`read`**: log files read
* **`write`**: log files written to
* **`task`**: log when tasks start and end, and how long they take
* **`cache`**: log when we use the cached version of a task (can be
    useful for debug) (default: false)

All values default to `true` unless specified otherwise.


### `watch`

(default: true)

If true, `engage` will watch the filesystem for changes. If false, it
will not, and will terminate as soon as the initial run is finished.



File/directory objects
----------------------

The objects you read and write to are `FSNode` instances, which
represent some location in the FileSystem. That location may or may
not already exist: for instance, you can get a reference to a file
that doesn't exist, so you cannot read it, but you can write to
it. Similarly, you can get a reference to a directory that doesn't
exist; if you try to list its contents, the directory will simply be
created.

Files and directories are not represented by nodes with different
types, because the same node can change type through filesystem
manipulations.

The following methods and properties are available:


### `type`

May be `"file"`, `"directory"` or `null`.

### `exists()`

Returns whether the current node exists.

### `moreRecent(other)`

Returns whether this node was last modified more recently than the one
passed as an argument.

### `older(other)`

Returns whether this node was last modified less recently than the one
passed as an argument.

### `copy(dest)`

Copy to the destination. The destination must be a string, another
`FSNode` or a renaming object. For example:

    node.copy("/some/path")
    node.copy(root.get("/some/path"))
    node.copy({to: "/some/path"})
    node.copy({extension: ".html"})

`copy` can copy files or whole directories.


### **Available on files**

### `read()`

Contents of the file as a `Buffer` instance.

### `readText()`

Text contents of the file as a string.

### `write(contents)`

Write contents to the file (String or Buffer).

### `contents`

Contents of the file as a `Buffer` instance. Equivalent to `read()`.

### `text`

Text contents of the file as a string. Equivalent to `readText()`.


### **Available on directories**

### `get(filename)`

If the node is a directory, return the file or directory with that
name. If the current node is a file, this will fail. If the current
node does not exist, then a directory will be created at this
location.

### `find(glob[, ...])`

Returns an iterable for all the files that match the glob relative to
the directory on which the method is called. More than one glob can be
provided. A glob that starts with `!` will be negated, meaning that
all matching files will be removed from the iterable.

### `forEach(function)`

Call function on every file/directory in this directory.

### `map(function)`

Call function on every file/directory in this directory and returns an
array of the results.

### `[Symbol.iterator](function)`

Returns a generator for all the files/directory in this
directory. Compatible with `for..of`.


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
  handle.
  * Do *not* modify fields in external objects
  * Do *not* push data in external arrays
  * Do *not* use data that may be modified by another part of the code
  * It is fine to do mutation on data which you know is 100% local
    to the task. Just don't let any other task see it.

* **Do not nest tasks.** Engage controls `this` and the arguments to a
  task, but not free variables, so you may run into issues if you
  manipulate them, or if the parent scope does (you should be fine if
  they are constant). I recommend not doing it at all. Define every
  task in module or global scope.

* Arguments to a task should be FSNode objects (`engage`'s
  file/directory handles) or small data (strings, integers, small
  objects). They are serialized to form a cache key, which is only
  supported for specific types (and it is probably unwise to do it for
  very large objects).



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
   engage, uglify-js -> minify

require-macros:
   "engage" -> task

task t-minify(file) =
   minify(file.text, {from-string = true}).code

task t-cat(content) =
   result = content.find("**/*.js").map(t-minify).join(";")
   @rename-out(content).get("main.js").write(result)

engage(t-cat, opts).run() where opts = {
   paths = {
      root = __dirname
      content = "content"
      output = "out"
   }
}
```

