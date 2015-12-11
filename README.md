
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

See how short that is? But it gives you a lot:

* **Incremental**: `engage.task` track all reads and all file changes
  so that work can be minimized:
  * Modify a `.js` file and only that file will be minified again.
  * Add a `.js` file and it will be compiled and packed along.
  * Adding, moving and deleting files and directories will work as
    expected.

* There is no `engage-minify` package. There is no need for one. The
  `uglify-js` package already exports a `minify` function that maps a
  source string to minified source. That is all you need!
  * Now you can take this code and adapt it to **any** source to
    source compiler! No need to wait for someone else to do it for
    you!

* Deriving the output file from the source file is made easy with
  `this.renameOut`.
  * The renamer is automatically derived from `paths.content` and
    `paths.output`.

* The `paths.content` option determines what the main task (`tCat` in
  the example) receives in its `content` argument. Note that this is
  equivalent to `content = this.get(this.paths.content)`. You can use
  `this.get` to open any file on the filesystem, if needed.
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


### **Available on files**

### `contents`

Contents of the file as a `Buffer` instance.

### `text`

Text contents of the file as a string.

### `read()`

Contents of the file as a `Buffer` instance.

### `write(contents)`

Write contents to the file (String or Buffer).


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

* **Do not nest tasks.** I mean... technically, you can... but you
  will run into strange issues if you don't know the finer points of
  how engage works. For now, I simply recommend not doing it at
  all. Define every task in module or global scope.

* Arguments to a task should be engage file/directory handles or small
  data (strings, integers, small objects). Not arbitrary objects.



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
   engage -> task

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

