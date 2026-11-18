import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import verifier from '../verify-macos-bundle.cjs';

function frameworkFixture(t) {
    const app = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-framework-test-'));
    t.after(() => fs.rmSync(app, { recursive: true, force: true }));
    const framework = path.join(app, 'Contents/Frameworks/Electron Framework.framework');
    fs.mkdirSync(path.join(framework, 'Versions/A'), { recursive: true });
    fs.symlinkSync('A', path.join(framework, 'Versions/Current'));
    fs.symlinkSync('Versions/Current/Electron Framework', path.join(framework, 'Electron Framework'));
    return { app, binary: path.join(framework, 'Versions/A/Electron Framework') };
}

test('reject an installer copy with both framework symlinks intact and the executable missing', (t) => {
    const { app } = frameworkFixture(t);
    assert.throws(() => verifier.resolveFrameworkExecutable(app), /Electron Framework is missing or invalid/);
});

test('the framework symlinks must resolve to a nonempty executable inside the versioned framework', (t) => {
    const { app, binary } = frameworkFixture(t);
    fs.writeFileSync(binary, '');
    assert.throws(() => verifier.resolveFrameworkExecutable(app), /nonempty/);
    fs.writeFileSync(binary, 'fixture');
    fs.chmodSync(binary, 0o755);
    assert.equal(verifier.resolveFrameworkExecutable(app), fs.realpathSync(binary));

    const outside = path.join(app, 'substitute');
    fs.renameSync(binary, outside);
    fs.symlinkSync(outside, binary);
    assert.throws(() => verifier.resolveFrameworkExecutable(app), /in-bundle/);
});
