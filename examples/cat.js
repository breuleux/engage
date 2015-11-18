require("earlgrey/register");

var engage = require("../src");

var rootPath = "./content";
var outPath = "./out";

var tCat = engage.task(function(root) {
    var filesContents = root.find("**/*.cat").map(function (file) {
        this.log("Read " + file.path);
        return file.text;
    });
    var dest = this.renameOut(root);
    this.log("Write " + dest.path);
    dest.write(filesContents.join(""));
});

var tMain = engage.task(function () {
    var root = this.get(this.rootPath);
    tCat(root.get("partsA"));
    tCat(root.get("partsB"));
});

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath
};

engage(tMain, opts).run();
