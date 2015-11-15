
engage
======

Incremental build tool with automatic dependency tracking. Very alpha.


Principles
----------

* **Incremental**: engage knows what has been done, so it doesn't need
  to do it again. You change one file, it recompiles one file.

* **Fast**: because, see above.

* **Easy**: engage's API is simple and doesn't really require any new
  concepts or boilerplate.

* **No frivolous plugins**: any function that operates a source to
  source transform can just be used directly, there is no need for a
  specific plugin to, say, transform Markdown files with engage.



Example
-------

Here's a detailed example with one trivial concatenation task and
markdown compilation.

There is no `engage` command, so you may run the example with `node
example.js` directly.

**example.js**

```javascript
var engage = require("engage");
var marked = require("marked");
var task = engage.task;
var Renamer = engage.Renamer;

// This task concatenates all files that end in `.cat` (in an unspecified order)
// in the directory `root` into an output file with the same name as `root`
var tCat = task(function(root) {

    // find(...).map(f) will automatically make a task out of f, which
    // means its results will be cached. This means the function
    // passed to map should either be pure, or have no side effects
    // that might affect tCat's output (accumulating into a variable,
    // e.g. `accum += file.text`, would be such an undesirable side
    // effect)
    var result = root.find("**/*.cat").map(function (file) {
        // By default this is console.log, but you can of course override it.
        this.log("Reading " + file.path);
        return file.text;
    }).join("");

    // this.renameOut is a Renamer instance that can map a source path to
    // an output path. We define it near the end of the example.
    var dest = this.renameOut(root);
    this.log("Write " + dest.path);

    // Use dest.write to write out the result. Note that is ok to have
    // a side effect here, because the side effect will not affect
    // other tasks.
    dest.write(result);
});

// This task compiles all markdown files in the given root directory
// into the corresponding output file so e.g. content/index.md will be
// compiled into out/index.html
var tMarkdown = task(function (root) {
    root.find("**/*.md").map(function (file) {
        // this.renameOut is defined at the end; basically, it will transform
        // "content/thing.md" into "out/thing.html"
        var dest = this.renameOut(file, {extension: ".html"});

        this.log("Compile " + file.path + " -> " + dest.path);

        // We use the marked function directly on file.text, which is
        // the file's contents parsed as utf8; if you need a Buffer, you
        // can use file.contents
        dest.write(marked(file.text));
    });
});


// This is our main task.
var tMain = task(function () {
    // this.get can be used to get any path on the filesystem, here we
    // get our rootPath as defined in configuration below. Note that engage
    // does not do anything special with `rootPath`, you can name it whatever
    // you want.
    var root = this.get(this.rootPath);

    // Concatenate content/partsA/**/*.cat into out/partsA
    tCat(root.get("partsA"));
    // Concatenate content/partsB/**/*.cat into out/partsB
    tCat(root.get("partsB"));
    // Compile content/**/*.md into out/**/*.md
    tMarkdown(root);
});


// Settings
var rootPath = "./content"
var outPath = "./out"

// The task will receive these options into `this`.
opts = {
    // Wait for 100 milliseconds without changes before triggering rebuilds
    debounce: 100,

    // With these parameters, this.renameOut will be a Renamer instance that transforms
    // ./content/whatever into ./out/whatever
    renameOut: Renamer({from: rootPath, to: outPath}),

    // Our content and output paths
    rootPath: rootPath,
    outPath: outPath
};

// Run engage like this:
engage(tMain, opts).run();
```

Now, run `node example.js` in the background and try editing `.cat`
and `.md` files in `content/`. Also add some, remove some, and so
on. Notice how `engage` minimizes work:

* Modify a Markdown file and only that file will be recompiled.
* Add a Markdown file and it will be compiled along the others.
* Modify one `.cat` file, and not only will `engage` regenerate the
  concatenation, it will re-read *only* the one file that was
  modified!
* Removing `.cat` files will also regenerate the concatenation!

Also note:

* Removing a Markdown file will *not* clean up the output, but we
  never asked the system to do this, and it could be dangerous
  behavior if it did this unbidden. It would be a bit tricky to make a
  cleaning task at the moment, but there may be improvements in the
  future.



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
