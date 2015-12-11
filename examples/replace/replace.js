
var engage = require("engage");

var tConfig = engage.task("config", function () {
    var cfgfile = this.get(this.rootPath).get("replacements.json");
    return JSON.parse(cfgfile.text);
});

var tReplace = engage.task("replace", function (file, repl) {
    var result = file.text;
    Object.keys(repl).forEach(function (a) {
        result = result.replace(a, repl[a]);
    });
    this.renameOut(file).write(result);
});

var tMain = engage.task("main", function () {
    var cfg = tConfig();
    var files = this.get(this.rootPath).find("**/*.txt");
    files.forEach(function (f) { tReplace(f, cfg); });
});

var rootPath = "./content";
var outPath = "./out";

opts = {
    renameOut: engage.Renamer({from: rootPath, to: outPath}),
    rootPath: rootPath,
    outPath: outPath
};

engage(tMain, opts).run();
