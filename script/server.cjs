const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

let port = 80;

for (let i = 0; i < args.length; i++) {
    if (args[i] === "--port") {
        port = Number(args[i + 1]);
        break;
    }
}

const publicDir = path.resolve(__dirname, "../public");
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
    try {
        let requestPath = decodeURIComponent(
            new URL(req.url, "http://localhost").pathname
        );

        if (requestPath === "/") {
            requestPath = "/index.html";
        }

        const filePath = path.resolve(
            publicDir,
            "." + requestPath
        );

        if (
            filePath !== publicDir &&
            !filePath.startsWith(publicDir + path.sep)
        ) {
            res.writeHead(403);
            res.end("Forbidden");
            return;
        }

        const file = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();

        res.writeHead(200, {
            "Content-Type":
                mimeTypes[ext] || "application/octet-stream"
        });

        res.end(file);
    } catch (error) {
        console.error(error);

        res.writeHead(404);
        res.end("Not Found");
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});