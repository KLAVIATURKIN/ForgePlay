import { exec } from "@yao-pkg/pkg";
import * as ResEdit from "resedit";
import * as PE from "pe-library";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const tempExe = path.join(rootDir, "dist", "ForgePlay-temp.exe");
const outputExe = path.join(rootDir, "dist", "ForgePlay.exe");
const iconFile = path.join(rootDir, "public", "favicon.ico");

async function main() {
    console.log("Building executable...");

    await exec([
        path.join(rootDir, "script", "server.cjs"),

        "--config",
        path.join(rootDir, "package.json"),

        "--target",
        "node24-win-x64",

        "--output",
        tempExe,

        "--no-bytecode",
        "--public",
        "--public-packages",
        "*"
    ]);

    console.log("Setting executable icon...");

    const exe = PE.NtExecutable.from(
        fs.readFileSync(tempExe)
    );

    const resource = PE.NtExecutableResource.from(exe);

    const iconFileData = ResEdit.Data.IconFile.from(
        fs.readFileSync(iconFile)
    );

    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
        resource.entries,
        1,
        1033,
        iconFileData.icons.map((icon) => icon.data)
    );

    resource.outputResource(exe);

    fs.writeFileSync(
        outputExe,
        Buffer.from(exe.generate())
    );

    fs.rmSync(tempExe, { force: true });

    console.log(`Created: ${outputExe}`);
}

main().catch((error) => {
    console.error("Executable build failed.");
    console.error(error);

    fs.rmSync(tempExe, { force: true });
    fs.rmSync(outputExe, { force: true });

    process.exit(1);
});