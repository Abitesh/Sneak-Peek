import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

for (const name of ['GlobalChatOverlay', 'MeetingChatOverlay']) {
  test(`${name}: closing, replacing or unmounting cancels the actual delayed initial submission`, () => {
    const source = fs.readFileSync(`src/components/${name}.tsx`, 'utf8');
    const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let effect;
    const visit = node => {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect' && node.arguments[0]?.getText(ast).includes('setTimeout')) effect = node.arguments[0].getText(ast);
      ts.forEachChild(node, visit);
    };
    visit(ast); assert.ok(effect);
    const timers = new Map(), submitted = []; let sequence = 0;
    const context = { isOpen: true, initialQuery: 'first', messages: [], setChatState() {}, submitQuestion: q => submitted.push(q), setTimeout: fn => { timers.set(++sequence, fn); return sequence; }, clearTimeout: id => timers.delete(id) };
    vm.createContext(context);
    const mount = () => vm.runInContext(`(${effect})()`, context);
    const cleanup = mount(); assert.equal(timers.size, 1); assert.equal(typeof cleanup, 'function');
    cleanup(); context.isOpen = false; assert.equal(mount(), undefined);
    for (const fn of timers.values()) fn(); assert.deepEqual(submitted, []);
    context.isOpen = true; context.initialQuery = 'replacement';
    const nextCleanup = mount(); for (const fn of timers.values()) fn();
    assert.deepEqual(submitted, ['replacement']); nextCleanup(); assert.equal(timers.size, 0);
  });
}
