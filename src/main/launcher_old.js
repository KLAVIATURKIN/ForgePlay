import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PORT = 80;

// ============================================================
// PORT
// ============================================================

const args = process.argv.slice(2);

let port = DEFAULT_PORT;

const portIndex = args.findIndex(
    arg => arg === '--port' || arg === '-p'
);

if (portIndex !== -1) {
    const value = Number(args[portIndex + 1]);

    if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 65535
    ) {
        console.error(
            `[Launcher] Invalid port: ${args[portIndex + 1]}`
        );

        process.exit(1);
    }

    port = value;
}

// ============================================================
// PUBLIC
// ============================================================
//
// When packaged, pkg puts the files into its snapshot:
//
// C:\snapshot\public\...
//
// The bundled launcher is inside:
//
// C:\snapshot\.forgeplay-build\launcher.cjs
//
// So ../public points to the embedded public directory.
// ============================================================

const PUBLIC_DIR = path.resolve(
    __dirname,
    '..',
    '..',
    'public'
);

// ============================================================
// MIME TYPES
// ============================================================

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',

    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',

    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',

    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',

    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
};

// ============================================================
// FILE PATH
// ============================================================

function resolveFile(url) {
    let pathname;

    try {
        pathname = decodeURIComponent(
            new URL(
                url,
                'http://localhost'
            ).pathname
        );
    } catch {
        return null;
    }

    // Current entry page.
    if (pathname === '/') {
        pathname = '/index.html';
    }

    pathname = pathname.replace(/^\/+/, '');

    const publicRoot = path.resolve(
        PUBLIC_DIR
    );

    const filePath = path.resolve(
        publicRoot,
        pathname
    );

    // Prevent ../ traversal.
    if (
        filePath !== publicRoot &&
        !filePath.startsWith(
            publicRoot + path.sep
        )
    ) {
        return null;
    }

    return filePath;
}

// ============================================================
// STARTUP
// ============================================================

console.log('');
console.log('========================================');
console.log('          ForgePlay / TwitchPlays');
console.log('========================================');
console.log('');

console.log(`[Launcher] Starting...`);
console.log(`[Launcher] Port: ${port}`);
console.log(`[Launcher] Public: ${PUBLIC_DIR}`);

console.log(
    `[Launcher] controller.html exists: ${
        fs.existsSync(
            path.join(
                PUBLIC_DIR,
                'controller.html'
            )
        )
    }`
);

console.log('');

// ============================================================
// HTTP SERVER
// ============================================================

const server = http.createServer(
    (req, res) => {
        const started = Date.now();

        const filePath = resolveFile(
            req.url
        );

        if (!filePath) {
            res.writeHead(400);
            res.end('Bad Request');

            console.log(
                `[HTTP] ${req.method} ${req.url} → 400 (${Date.now() - started}ms)`
            );

            return;
        }

        try {
            const stats = fs.statSync(
                filePath
            );

            if (!stats.isFile()) {
                throw new Error(
                    'Not a file'
                );
            }

            const data = fs.readFileSync(
                filePath
            );

            const extension = path
                .extname(filePath)
                .toLowerCase();

            const contentType =
                MIME_TYPES[extension] ??
                'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
            });

            res.end(data);

            console.log(
                `[HTTP] ${req.method} ${req.url} → 200 (${Date.now() - started}ms)`
            );
        } catch {
            res.writeHead(404);
            res.end('Not Found');

            console.log(
                `[HTTP] ${req.method} ${req.url} → 404 (${Date.now() - started}ms)`
            );
        }
    }
);

// ============================================================
// SERVER ERROR
// ============================================================

server.on(
    'error',
    error => {
        console.error(
            `[HTTP] Server error: ${error.message}`
        );

        if (
            error.code === 'EADDRINUSE'
        ) {
            console.error(
                `[Launcher] Port ${port} is already in use.`
            );
        }

        process.exit(1);
    }
);

// ============================================================
// START SERVER
// ============================================================

server.listen(
    port,
    '0.0.0.0',
    () => {
        console.log(
            `[HTTP] Listening on http://localhost:${port}`
        );

        console.log(
            `[Launcher] Server running on http://localhost:${port}`
        );

        console.log('');
        console.log(
            '[Launcher] Open http://localhost/ in your browser.'
        );

        console.log(
            '[Launcher] Press Ctrl+C to stop.'
        );

        console.log('');
    }
);

// ============================================================
// SHUTDOWN
// ============================================================

function shutdown() {
    console.log('');
    console.log('[Launcher] Shutting down...');

    server.close(() => {
        console.log('[Launcher] Server stopped.');
        process.exit(0);
    });
}

process.on(
    'SIGINT',
    shutdown
);

process.on(
    'SIGTERM',
    shutdown
);