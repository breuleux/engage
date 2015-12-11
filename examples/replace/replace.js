
var path = require("path");
var engage = require("engage");

var tConfig = engage.task("config", function () {
    var cfgfile = this.get(this.paths.content).get("replacements.json");
    return JSON.parse(cfgfile.text);
});

var tReplace = engage.task("replace", function (file, repl) {
    var result = file.text;
    Object.keys(repl).forEach(function (a) {
        result = result.replace(a, repl[a]);
    });
    this.renameOut(file).write(result);
});

var tMain = engage.task("main", function (root) {
    var cfg = tConfig();
    var files = root.find("**/*.txt");
    files.forEach(function (f) { tReplace(f, cfg); });
});

opts = {
    paths: {
        root: __dirname,
        content: "content",
        output: "out"
    },
    clean: true
};

engage(tMain, opts).run();
