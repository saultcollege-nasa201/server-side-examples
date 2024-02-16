// A simple file server with Node.js

// Import some necessary modules
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const txtParser = require("./txtParser.js");
const { contentType } = require("../utils/utils.js");

// The path to serve files from is passed as an argument
const serveFromPath = process.argv[2] || "./";
const PORT = 8000; // The port to listen on

// Configure our HTTP server to respond to any requests.
http.createServer(handleRequest)
    .listen(PORT, "localhost", () => {
        console.log(`Serving contents of ${serveFromPath} at http://localhost:${PORT}/`);
    });

// Function to handle requests (referred to in the createServer call above)
async function handleRequest(request, response) {
    // Log the request method and URL
    console.log(`Request: ${request.method} ${request.url}`);

    try {
        // Get the full path to the requested file
        const filePath = await fullPath(serveFromPath, request.url);

        // If it is, get its contents and send them to the client
        let fileContent = await fs.readFile(filePath, { encoding: "utf-8" });
        if ( filePath.endsWith(".txt") ) {
            
            // Get the template that we will use to convert the txt file to HTML
            let template = await fs.readFile(path.join(serveFromPath, "template.html"), { encoding: "utf-8" });

            // Convert the txt file to HTML
            fileContent = await txtParser.toHtml(fileContent, {template, getPagesInFolder});
        }
        // Set the HTTP headers
        response.writeHead(200, { 
            "Content-Type": contentType(filePath.replace('.txt', '.html')),
            // Set the Content-Security-Policy header to restrict where resources can be loaded from
            // This is a simple example that only allows resources to be loaded from the same origin
            // and does not allow any JavaScript to be executed
            "Content-Security-Policy": "default-src 'self'; img-src 'self' data:"
        });
        // Send the file contents to the client
        response.end(fileContent, "utf-8");
    } catch (error) {
        // Try adding .txt to the file path
        console.log("Error: " + error);
        response.writeHead(404);
        response.end("Not found");
        return;
    }
}

// This function allows the template engine to get the list of pages in a folder
// So that it can parse the @folderName syntax to generate a list of links
async function getPagesInFolder(folder) {
    try {
        const folderPath = path.join(serveFromPath, folder);
        //console.log(`Reading folder ${folder}`);
        const files = await fs.readdir(folderPath);
        //console.log(`Files ${files}`);
        return files;
    } catch (error) {
        return [];
    }
}

async function fullPath(base, url) {

    if ( url === "/" ) {
        return path.join(base, "index.txt");
    }

    let filePath = path.join(base, url);

    try {
        // First, let's see if there is a file at the original path
        await fs.access(filePath, fs.constants.F_OK);
        return filePath;
    } catch (error) {
        try {
            // If not, let's try adding .txt to the file path
            filePath += ".txt";
            await fs.access(filePath, fs.constants.F_OK);
            return filePath;
        } catch (error) {
            // If none of these paths exist, throw an error
            throw new Error("File not found");
        }
    }
}