
var engage = require("../../lib");
var marked = require("marked");

var rootPath = "./content";
var outPath = "./out";

var tMarkdown = engage.task("markdown", function (file) {
    destination = this.renameOut(file, {extension: ".html"});
    this.log("Writing file: " + destination.path);
    destination.write(marked(file.text));
});

var tMarkdownAll = engage.task("markdownAll", function (root) {
    root.find("**/*.md").forEach(tMarkdown);
});

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath,
    clean: true
};

engage(tMarkdownAll, opts).run();
