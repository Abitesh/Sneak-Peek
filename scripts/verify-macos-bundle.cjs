const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const frameworkName = 'Electron Framework';
const appFrameworksPath = 'Contents/Frameworks';
const frameworkPath = `${appFrameworksPath}/${frameworkName}.framework`;
const architectureSlices = { arm64: ['arm64'], x64: ['x86_64'], universal: ['arm64', 'x86_64'] };

function command(file, args) {
    return execFileSync(file, args, { encoding: 'utf8' });
}

function resolveFrameworkExecutable(appPath) {
    const framework = path.join(appPath, frameworkPath);
    const binary = path.join(framework, frameworkName);
    try {
        const versioned = fs.realpathSync(path.join(framework, 'Versions', 'Current', frameworkName));
        if (fs.realpathSync(binary) !== versioned ||
            !versioned.startsWith(fs.realpathSync(framework) + path.sep + 'Versions' + path.sep) ||
            !fs.statSync(versioned).isFile() || fs.statSync(versioned).size === 0) {
            throw new Error('expected a nonempty in-bundle versioned executable');
        }
        fs.accessSync(versioned, fs.constants.X_OK);
        return versioned;
    } catch (error) {
        throw new Error(`Electron Framework is missing or invalid in ${appPath}: ${error.message}`);
    }
}

function verifyMacBundle(appPath, targetArch) {
    const expected = architectureSlices[targetArch];
    if (!expected) throw new Error(`Unsupported macOS architecture: ${targetArch}`);
    const framework = resolveFrameworkExecutable(appPath);
    const executableName = command('/usr/libexec/PlistBuddy', [
        '-c', 'Print :CFBundleExecutable', path.join(appPath, 'Contents', 'Info.plist'),
    ]).trim();
    const executable = path.join(appPath, 'Contents', 'MacOS', executableName);
    const dependencies = command('/usr/bin/otool', ['-L', executable]);
    const loadCommands = command('/usr/bin/otool', ['-l', executable]);
    if (!dependencies.includes(`@rpath/${frameworkName}.framework/${frameworkName}`) ||
        !/cmd LC_RPATH\s+cmdsize \d+\s+path @executable_path\/\.\.\/Frameworks \(/.test(loadCommands)) {
        throw new Error(`Electron Framework load path does not resolve in ${executable}`);
    }

    const assertArch = (binary, slices) => {
        const actual = command('/usr/bin/lipo', ['-archs', binary]).trim().split(/\s+/);
        if (!slices.every((slice) => actual.includes(slice))) {
            throw new Error(`${binary}: expected ${slices.join(', ')}, got ${actual.join(', ')}`);
        }
    };
    assertArch(executable, expected);
    assertArch(framework, expected);
    const unpacked = path.join(appPath, 'Contents', 'Resources', 'app.asar.unpacked');
    for (const binding of ['better-sqlite3/build/Release/better_sqlite3.node', 'keytar/build/Release/keytar.node']) {
        assertArch(path.join(unpacked, 'node_modules', binding), expected);
    }
    for (const slice of expected) {
        const arch = slice === 'x86_64' ? 'x64' : slice;
        assertArch(path.join(unpacked, 'native-module', `index.darwin-${arch}.node`), [slice]);
    }
    command('/usr/bin/codesign', ['--verify', '--deep', '--strict', appPath]);
    console.log(`[Mac bundle] Framework, rpath, native architecture and signature verified (${targetArch}): ${appPath}`);
    return executable;
}

async function withMountedDmg(dmg, verify) {
    const mount = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-dmg-verify-'));
    let attached = false;
    try {
        command('/usr/bin/hdiutil', ['attach', '-readonly', '-nobrowse', '-quiet', '-mountpoint', mount, dmg]);
        attached = true;
        const apps = fs.readdirSync(mount, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'));
        if (apps.length !== 1) throw new Error(`Expected exactly one app in ${dmg}, found ${apps.length}`);
        await verify(path.join(mount, apps[0].name));
    } finally {
        if (attached) command('/usr/bin/hdiutil', ['detach', '-quiet', mount]);
        fs.rmdirSync(mount);
    }
}

async function verifyStartup(executable, targetArch) {
    if (targetArch !== 'universal' && process.arch !== targetArch) {
        throw new Error(`Run the startup smoke on ${targetArch} (host Node is ${process.arch})`);
    }

    // Never run a packaging smoke against the owner's settings or debug log.
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-launch-verify-'));
    const documents = path.join(home, 'Documents');
    fs.mkdirSync(documents);
    const profile = path.join(home, 'profile');
    fs.mkdirSync(profile);
    // Electron uses this switch for macOS tests. It is passed only to the disposable child.
    const child = spawn(executable, ['--use-mock-keychain', `--user-data-dir=${profile}`], {
        cwd: home,
        env: {
            PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
            HOME: home,
            CFFIXED_USER_HOME: home,
            NATIVELY_TEST_USERDATA: profile,
        },
        stdio: 'ignore',
    });
    let spawnError;
    child.on('error', (error) => { spawnError = error; });
    const stopped = new Promise((resolve) => child.once('close', resolve));
    try {
        const log = path.join(documents, 'natively_debug.log');
        const deadline = Date.now() + 30000;
        while (Date.now() < deadline) {
            if (spawnError) throw spawnError;
            if (child.exitCode !== null || child.signalCode !== null) {
                throw new Error(`Packaged executable exited early (${child.exitCode ?? child.signalCode})`);
            }
            const contents = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
            if (contents.includes('[STARTUP:initializeApp:complete]')) {
                console.log(`[Mac bundle] Packaged Electron startup completed with an isolated profile: ${executable}`);
                return;
            }
            await delay(200);
        }
        throw new Error('Packaged Electron startup did not complete in 30 seconds');
    } finally {
        child.kill('SIGTERM');
        const killTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
        await stopped;
        clearTimeout(killTimer);
        fs.rmSync(home, { recursive: true, force: true });
    }
}

async function verifyPath(file, targetArch, launch) {
    const verify = async (appPath) => {
        const executable = verifyMacBundle(appPath, targetArch);
        if (launch) await verifyStartup(executable, targetArch);
    };
    if (file.endsWith('.dmg')) await withMountedDmg(file, verify);
    else if (file.endsWith('.app')) await verify(file);
    else throw new Error('Expected a .dmg or .app path');
}

// Verify the installer itself. A valid unpacked .app alone missed ERR-119.
exports.default = async ({ file, arch }) => {
    if (process.platform !== 'darwin' || !file?.endsWith('.dmg')) return;
    await verifyPath(file, require('builder-util').Arch[arch], false);
};
exports.verifyMacBundle = verifyMacBundle;
exports.resolveFrameworkExecutable = resolveFrameworkExecutable;

if (require.main === module) {
    const [file, arch, launch, ...extra] = process.argv.slice(2);
    if (!file || !architectureSlices[arch] || (launch && launch !== '--launch') || extra.length) {
        console.error('Usage: node scripts/verify-macos-bundle.cjs <.app|.dmg> <arm64|x64|universal> [--launch]');
        process.exitCode = 2;
    } else {
        verifyPath(path.resolve(file), arch, launch === '--launch').catch((error) => {
            console.error(`[Mac bundle] ${error.message}`);
            process.exitCode = 1;
        });
    }
}
