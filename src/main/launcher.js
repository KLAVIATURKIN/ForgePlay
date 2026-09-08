import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_PORT = 80;

// ============================================================
// HOST IP
// ============================================================

function getHostIp() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] ?? []) {
            if (
                iface.family === 'IPv4' &&
                !iface.internal
            ) {
                return iface.address;
            }
        }
    }

    return '127.0.0.1';
}

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
// So ../.. /public points to the embedded public directory.
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
// DIRECTORY LISTING
// ============================================================

function createDirectoryListing(
    directoryPath,
    requestPath
) {
    const entries = fs.readdirSync(
        directoryPath,
        {
            withFileTypes: true
        }
    );

    const basePath = requestPath.endsWith('/')
        ? requestPath
        : `${requestPath}/`;

    const rows = entries
        .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) {
                return -1;
            }

            if (!a.isDirectory() && b.isDirectory()) {
                return 1;
            }

            return a.name.localeCompare(
                b.name,
                undefined,
                {
                    sensitivity: 'base'
                }
            );
        })
        .map(entry => {
            const encodedName =
                encodeURIComponent(entry.name);

            const href =
                `${basePath}${encodedName}${entry.isDirectory() ? '/' : ''}`;

            const label =
                entry.isDirectory()
                    ? `${entry.name}/`
                    : entry.name;

            return `
                <li>
                    <a href="${href}">${label}</a>
                </li>
            `;
        })
        .join('');

    const parent =
        requestPath !== '/' &&
        requestPath !== ''
            ? '<li><a href="../">../</a></li>'
            : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Index of ${requestPath}</title>
    <style>
        body {
            margin: 0;
            padding: 32px;
            background: #0b0d11;
            color: #edf2f7;
            font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
        }

        h1 {
            margin-top: 0;
            font-size: 24px;
        }

        ul {
            padding-left: 20px;
        }

        li {
            margin: 8px 0;
        }

        a {
            color: #9a84ff;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Index of ${requestPath}</h1>
    <ul>
        ${parent}
        ${rows}
    </ul>
</body>
</html>`;
}

// ============================================================
// STARTUP
// ============================================================

console.log('');
console.log('========================================');
console.log('          ForgePlay / Controller        ');
console.log('========================================');
console.log('');

console.log(`[Launcher] Starting...`);
console.log(`[Launcher] Port: ${port}`);
console.log(`[Launcher] Public: ${PUBLIC_DIR}`);

// console.log(
//     `[Launcher] public exists: ${
//         fs.existsSync(PUBLIC_DIR)
//     }`
// );

// console.log(
//     `[Launcher] controller.html exists: ${
//         fs.existsSync(
//             path.join(
//                 PUBLIC_DIR,
//                 'controller.html'
//             )
//         )
//     }`
// );

// console.log(
//     `[Launcher] layouts exists: ${
//         fs.existsSync(
//             path.join(
//                 PUBLIC_DIR,
//                 'layouts'
//             )
//         )
//     }`
// );

// console.log(
//     `[Launcher] xbox360 exists: ${
//         fs.existsSync(
//             path.join(
//                 PUBLIC_DIR,
//                 'layouts',
//                 'xbox360'
//             )
//         )
//     }`
// );

// try {
//     const layoutsPath = path.join(
//         PUBLIC_DIR,
//         'layouts'
//     );

//     if (fs.existsSync(layoutsPath)) {
//         console.log(
//             `[Launcher] layouts entries:`,
//             fs.readdirSync(
//                 layoutsPath
//             )
//         );
//     }
// } catch (error) {
//     console.error(
//         `[Launcher] Failed to read layouts: ${error.message}`
//     );
// }

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
            res.writeHead(400, {
                'Content-Type':
                    'text/plain; charset=utf-8'
            });

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

            // ====================================================
            // DIRECTORY
            // ====================================================

            if (stats.isDirectory()) {
                const pathname =
                    new URL(
                        req.url,
                        'http://localhost'
                    ).pathname;

                const normalizedPath =
                    pathname.endsWith('/')
                        ? pathname
                        : `${pathname}/`;

                const html =
                    createDirectoryListing(
                        filePath,
                        normalizedPath
                    );

                res.writeHead(200, {
                    'Content-Type':
                        'text/html; charset=utf-8',
                    'Cache-Control':
                        'no-store',
                });

                res.end(html);

                console.log(
                    `[HTTP] ${req.method} ${req.url} → 200 directory (${Date.now() - started}ms)`
                );

                return;
            }

            // ====================================================
            // FILE
            // ====================================================

            if (stats.isFile()) {
                const data =
                    fs.readFileSync(
                        filePath
                    );

                const extension =
                    path.extname(
                        filePath
                    ).toLowerCase();

                const contentType =
                    MIME_TYPES[extension] ??
                    'application/octet-stream';

                res.writeHead(200, {
                    'Content-Type':
                    contentType,
                });

                res.end(data);

                console.log(
                    `[HTTP] ${req.method} ${req.url} → 200 (${Date.now() - started}ms)`
                );

                return;
            }

            throw new Error(
                'Unsupported filesystem entry'
            );

        } catch (error) {
            res.writeHead(404, {
                'Content-Type':
                    'text/plain; charset=utf-8'
            });

            res.end('Not Found');

            console.log(
                `[HTTP] ${req.method} ${req.url} → 404 (${Date.now() - started}ms)`
            );

            if (
                error?.message &&
                error.message !==
                'Not Found'
            ) {
                console.error(
                    `[HTTP] ${error.message}`
                );
            }
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

const hostIp = getHostIp();
server.listen(
    port,
    '0.0.0.0',
    () => {
        console.log(
            `[Launcher] Server running on http://${hostIp}:${port}`
        );

        console.log('');
        console.log(
            `[Launcher] Open in your browser: http://${hostIp}:${port}/`
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