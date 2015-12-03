
var engage = require("../../lib");

var rootPath = "./content";
var outPath = "./out";

var tRead = engage.task("read", function (file) {
    this.log("Read " + file.path);
    return file.text;
});

var tCat = engage.task("cat", function(root) {
    if (root.type !== "directory")
        return
    var filesContents = root.find("**/*.cat").map(tRead);
    var dest = this.renameOut(root);
    this.log("Write " + dest.path);
    dest.write(filesContents.join(""));
});

var tMain = engage.task("main", function (root) {
    root.forEach(tCat);
});

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath,
    clean: true
};

engage(tMain, opts).run();
