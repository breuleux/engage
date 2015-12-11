
var path = require("path");
var engage = require("engage");
var marked = require("marked");
var jade = require("jade");

var tTemplate = engage.task("template", function () {
    var file = this.get(this.paths.content).get(this.templateFile);
    return jade.compile(file.text, {});
});

var tMarkdown = engage.task("markdown", function (file) {
    var template = tTemplate();
    var result = template({
        title: file.path,
        body: marked(file.text)
    });
    this.renameOut(file, {extension: ".html"}).write(result);
});

var tMarkdownAll = engage.task("markdownAll", function (root) {
    root.find("**/*.md").forEach(tMarkdown);
});

opts = {
    templateFile: "template.jade",
    paths: {
        root: __dirname,
        content: "content",
        output: "out"
    },
    clean: true
};

engage(tMarkdownAll, opts).run();
