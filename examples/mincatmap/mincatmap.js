
var path = require("path");
var engage = require("engage");
var minify = require("uglify-js").minify;
var Concat = require("concat-with-sourcemaps");

var tMinify = engage.task("minify", function (file) {
    var result = minify(file.text, {fromString: true, outSourceMap: "_"});
    // Don't know how to tell minify not to add sourceMappingURL so I take it out myself
    var code = result.code.replace(/\n?\/\/# sourceMappingURL[^\n]*/, "");
    // Tweak the map to point to the right source (relative to the output)
    var map = JSON.parse(result.map);
    map.sources = [path.relative(this.paths.output, file.path)];
    return {code: code, map: map};
});

var tCat = engage.task("cat", function(root) {
    var result = new Concat(true, "all.js", ";\n");
    root.find("**/*.js").forEach(function (file) {
        var min = tMinify(file);
        result.add(file.path, min.code, min.map);
    });
    // We must tell the browser where the map is
    var code = result.content + "\n//# sourceMappingURL=all.js.map"
    this.renameOut(root).get("all.js").write(code);
    this.renameOut(root).get("all.js.map").write(result.sourceMap);
});

opts = {
    paths: {
        root: __dirname,
        content: "content",
        output: "out"
    }
};

engage(tCat, opts).run();
