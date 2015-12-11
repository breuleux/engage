
var path = require("path");
var engage = require("engage");
var minify = require("uglify-js").minify;

var tMinify = engage.task("minify", function (file) {
    var contents = file.text;
    var result = minify(contents, {fromString: true}).code;
    this.log("Minified " + file.path
             + " (" + contents.length + "B -> " + result.length + "B)");
    return result;
});

var tCat = engage.task("cat", function(root) {
    var result = root.find("**/*.js").map(tMinify).join(";");
    // You can "get" this file even if it doesn't exist, if your
    // intent is to write to it.
    var dest = this.renameOut(root).get("main.js");
    dest.write(result);
    this.log("Wrote " + dest.path + " (" + result.length + "B)");
});

opts = {
    paths: {
        root: __dirname,
        content: "content",
        output: "out"
    },
    show: {
        read: false,
        write: false
    }
};

engage(tCat, opts).run();
