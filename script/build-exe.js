import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PUBLIC_DIR = path.join(ROOT, 'public');
const LAUNCHER = path.join(ROOT, 'src', 'main', 'launcher.js');
const BUILD_DIR = path.join(ROOT, 'dist', '.forgeplay-build');
const BUNDLE = path.join(BUILD_DIR, 'launcher.cjs');
const OUTPUT = path.join(ROOT, 'dist', 'ForgePlay.exe');

// ============================================================
// START
// ============================================================

console.log('');
console.log('========================================');
console.log('       ForgePlay executable build');
console.log('========================================');
console.log('');

// ============================================================
// CHECK
// ============================================================

if (!fs.existsSync(PUBLIC_DIR)) {
    throw new Error(
        'public/ directory does not exist.'
    );
}
if (!fs.existsSync(LAUNCHER)) {
    throw new Error(
        'src/main/launcher.js does not exist.'
    );
}

// ============================================================
// CLEAN
// ============================================================

fs.rmSync(
    BUILD_DIR,
    {
        recursive: true,
        force: true,
    }
);

fs.mkdirSync(
    BUILD_DIR,
    {
        recursive: true,
    }
);

// ============================================================
// ESBUILD
// ============================================================

console.log('[Build] Bundling launcher...');
await build({
    entryPoints: [
        LAUNCHER,
    ],

    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    sourcemap: false,
    minify: false,
});
console.log('[Build] Launcher bundled.');

// ============================================================
// COUNT PUBLIC FILES
// ============================================================

function countFiles(directory) {
    let count = 0;

    for (
        const entry of fs.readdirSync(
            directory,
            {
                withFileTypes: true,
            }
        )
    ) {
        const fullPath = path.join(
            directory,
            entry.name
        );

        if (entry.isDirectory()) {
            count += countFiles(
                fullPath
            );
        } else {
            count++;
        }
    }

    return count;
}

console.log(`[Build] Found ${countFiles(PUBLIC_DIR)} public files.`);

// ============================================================
// FIND PKG
// ============================================================

const pkg = path.join(
    ROOT,
    'node_modules',
    '@yao-pkg',
    'pkg',
    'lib-es5',
    'bin.js'
);

if (!fs.existsSync(pkg)) {
    throw new Error(
        '\n@yao-pkg/pkg is not installed.\n\n' +
        'Run:\n' +
        'npm install --save-dev @yao-pkg/pkg\n'
    );
}

// ============================================================
// BUILD EXE
// ============================================================

console.log('[Build] Creating executable...');

execFileSync(
    process.execPath,
    [
        pkg,

        // Bundled application.
        BUNDLE,

        // IMPORTANT:
        // Tell pkg to use THIS project's package.json,
        // including "pkg": { "assets": ["public/**/*"] }.
        '--config',
        path.join(ROOT, 'package.json'),

        '--target',
        'host',

        '--output',
        OUTPUT,

        '--compress',
        'Brotli',
    ],
    {
        cwd: ROOT,
        stdio: 'inherit',
    }
);

// ============================================================
// CLEAN
// ============================================================

fs.rmSync(
    BUILD_DIR,
    {
        recursive: true,
        force: true,
    }
);

// ============================================================
// DONE
// ============================================================

console.log('');
console.log('========================================');
console.log('             BUILD COMPLETE');
console.log('========================================');
console.log('');
console.log(
    `Created: ${OUTPUT}`
);
console.log('');