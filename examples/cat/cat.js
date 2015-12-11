
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

opts = {
    paths: {
        root: __dirname,
        content: "content",
        output: "out"
    },
    clean: true
};

engage(tMain, opts).run();
