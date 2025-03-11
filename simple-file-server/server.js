// A simple file server with Node.js

// Import some necessary modules
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { contentType } = require("../utils/utils.js");

// The path to serve files from is passed as an argument
const serveFromPath = process.argv[2] || "./";
const PORT = process.argv[3] || 8000; // The port to listen on

// Configure our HTTP server to respond to any requests.
http.createServer(handleRequest)
    .listen(PORT, "localhost", () => {
        console.log(`Serving contents of ${serveFromPath} at http://localhost:${PORT}/`);
    });

// Function to handle requests (referred to in the createServer call above)
async function handleRequest(request, response) {
    // Log the request method and URL
    console.log(`Request: ${request.method} ${request.url}`);

    // Get the full path to the requested file
    let filePath = fullPath(serveFromPath, request.url);

    try {
        // Check if the file exists and is readable
        await fs.access(filePath, fs.constants.F_OK);
        // If it is, get its contents and send them to the client
        const fileContent = await fs.readFile(filePath, { encoding: "utf-8" });
        // Set the HTTP headers
        response.writeHead(200, { 
            // Set the Content-Type header based on the file extension
            "Content-Type": contentType(filePath),
            // Set the Content-Security-Policy header to restrict where resources can be loaded from
            // This is a simple example that only allows resources to be loaded from the same origin
            // and does not allow any JavaScript to be executed
            "Content-Security-Policy": "default-src 'self'; img-src 'self' data:"
        });
        // Send the file contents to the client
        response.end(fileContent, "utf-8");
    } catch (error) {
        console.log("Error: " + error);
        response.writeHead(404);
        response.end("File not found");
        return;
    }
}

function fullPath(base, url) {
    if ( url.endsWith("/") ) {
        url += "index.html";
    }
    return path.join(base, url);
}