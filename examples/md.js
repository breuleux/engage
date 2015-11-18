require("earlgrey/register");

var engage = require("../src");
var marked = require("marked");

var rootPath = "./content";
var outPath = "./out";

var tMarkdown = engage.task(function () {
    this.get(this.rootPath).find("**/*.md").map(function (file) {
        destination = this.renameOut(file, {extension: ".html"});
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
