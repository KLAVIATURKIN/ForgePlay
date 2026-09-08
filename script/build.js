import fs from 'node:fs';
import { build } from 'esbuild';

// ===== BUILD controller.js (the all-in-one application js file to import within .html file)
const minify = process.argv.includes('--min');
const clean = process.argv.includes('--clean');

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });

if (clean) {
    console.log(`cleaned up the dist directory completed...`);
    process.exit(0);
}

console.log(`Building controller (${minify ? 'minified' : 'development'})...`);
const build_start = performance.now();
await build({
    entryPoints: ['./src/main/controller.js'],
    bundle: true,
    outfile: './dist/controller.js',
    format: 'iife',
    minify,
    alias: {
        'comfy.js': './src/main/wrapper/comfy.browser.js',
    },
});
const build_time = performance.now() - build_start;

// ===== COPY ALL THE MODULES/COMPONENTS into a /public directory (for web server runtime)
console.log(`\nCopy application (${minify ? 'minified' : 'development'}) files...`);

const modules = [
    ['./node_modules/nipplejs/dist/nipplejs.js',  './dist/nipplejs.js'],
    ['./node_modules/comfy.js/dist/comfy.min.js', './dist/comfy.min.js'],
]
const components = [
    ["./dist/nipplejs.js",   "./public/js/nipplejs.js"],
    ["./dist/comfy.min.js",  "./public/js/comfy.min.js"],
    ["./dist/controller.js", "./public/js/controller.js"]
]

for (const [src, dest] of modules) {
    fs.copyFileSync(src, dest);
    console.log(`Created ${src} -> ${dest}`);
}
for (const [src, dest] of components) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
}
console.log(`\nBuild complete: ${build_time.toFixed(2)}ms`);