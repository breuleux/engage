
var path = require("path");
var engage = require("engage");

var tRead = engage.task("read", function (file) {
    return file.text;
});

var tCat = engage.task("cat", function(root) {
    if (root.type !== "directory")
        return
    var filesContents = root.find("**/*.cat").map(tRead);
    this.renameOut(root).write(filesContents.join(""));
});

var tMain = engage.task("main", function (root) {
    root.forEach(tCat);
});

var examplePath = path.relative(process.cwd(), __dirname);
var rootPath = path.join(examplePath, "content");
var outPath = path.join(examplePath, "out");

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath,
    clean: true
};

engage(tMain, opts).run();
