
engage
======

Incremental build tool with automatic dependency tracking. Very alpha.


Principles
----------

* **Incremental**: engage knows what has been done, so it doesn't need
  to do it again. You change one file, it recompiles one file.

* **Fast**: see above.

* **Easy**: engage's API is simple and doesn't really require any new
  concepts or boilerplate.

* **No frivolous plugins**: any function that operates a source to
  source transform can just be used directly, there is no need for a
  specific plugin to, say, transform Markdown files with engage.



Examples
--------

You may run this example with `node` directly.

    engage = require("engage");
    marked = require("marked");
    
    task = engage.task;
    Write = engage.Write;
    Renamer = engage.Renamer;
    
    // This task concatenates all files that end in `.cat` (in an unspecified order)
    // into the file ./out/whole
    tCat = task(function(root) {
        var accum = "";
        root.find("**/*.cat").map(function (file) {
            accum += file.text;
        });
        return Write("./out/whole", accum);
    });
    
    tMain = task(function () {
    
        // We resolve the directory in which we will get the contents
        var contentRoot = this.get(this.rootPath);
    
        // This compiles all our markdown files. Note that we use the
        // marked function directly, there's no need for a plugin.
        // this.rename refers to the rename object we build in the options below,
        // so e.g. content/index.md will be compiled into out/index.html
        var compiledMarkdown =
            contentRoot.find("**/*.md").map(function (file) {
                return Write(this.rename(file, {extension: ".html"}), marked(file.text));
            });
    
        // This is shorthand for the above.
        var compiledMarkdown =
            contentRoot.find("**/*.md").mapFile({extension: ".html"}, marked);
    
        // It is necessary to return the array of Write/etc. instructions to execute.
        // The instructions can be nested.
        return [
            compiledMarkdown,
            tCat(contentRoot)
        ];
    });
    
    // The task will receive these options into `this`.
    opts = {
       debounce: 100,
       rename: Renamer({from: "./content", to: "./out"}),
       readOnly: ["./content"],
       rootPath: "./content"
    };
    
    engage(tMain, opts).run();


The [Earl Grey](breuleux.github.io/earl-grey/) language has some macro
bindings for `engage` that makes it more pleasant to use. Here's the
above example in Earl Grey:


    require-macros:
       engage -> task

    require:
       marked
       engage -> (Write, Renamer)

    task t-cat(root) =
       var accum = ""
       root.find("**/*.cat").map with file ->
          accum += file.text
       Write("./out/whole", accum)

    task t-main() =
       content-root = @get(this.root-path)
       compiled-markdown = content-root.find("**/*.md").map with file ->
          Write(@rename(file, extension = ".html"), marked(file.text))
       compiled-markdown-2 =
          content-root.find("**/*.md").map-file(extension = ".html", marked)
       {compiled-markdown, t-cat(content-root)}

    engage(t-main, opts).run() where opts = {
       debounce = 100
       rename = Renamer(from = "./content", to = "./out")
       read-only: {"./content"}
       root-path: "./content"
    }
