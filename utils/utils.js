const path = require("path");


function contentType(filePath) {
    let ext = path.extname(filePath);
    var contentType = "text/html";
    switch (ext) {
        case ".js":
            contentType = "text/javascript";
            break;
        case ".css":
            contentType = "text/css";
            break;
        case ".jpg":
            contentType = "image/jpeg";
            break;
        case ".png":
            contentType = "image/png";
            break;
        case ".json":
            contentType = "application/json";
            break;
    }
    return contentType;
}

module.exports = { contentType };