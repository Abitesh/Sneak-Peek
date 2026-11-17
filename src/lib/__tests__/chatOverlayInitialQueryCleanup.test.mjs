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

test('GlobalChatOverlay: a closed request cannot reset a replacement or accept an unscoped completion', async () => {
  const source = fs.readFileSync('src/components/GlobalChatOverlay.tsx', 'utf8');
  const ast = ts.createSourceFile('GlobalChatOverlay.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const callbacks = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'submitQuestion') {
      callbacks.set('submitQuestion', node.initializer.arguments[0].getText(ast));
    }
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect'
      && node.arguments[0]?.getText(ast).includes('ragCancelQuery')) {
      callbacks.set('closeEffect', node.arguments[0].getText(ast));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);

  const listeners = { chunk: new Set(), done: new Set(), error: new Set() };
  const subscribe = kind => handler => {
    listeners[kind].add(handler);
    return () => listeners[kind].delete(handler);
  };
  const requests = new Map();
  const submitInFlightRef = { current: null };
  let nextMessageId = 0;
  let buffer = '';
  let rendererMessages = [];
  const context = vm.createContext({
    window: { electronAPI: {
      onRAGStreamChunk: subscribe('chunk'),
      onRAGStreamComplete: subscribe('done'),
      onRAGStreamError: subscribe('error'),
      ragQueryGlobal: question => new Promise(resolve => requests.set(question, resolve)),
    } },
    streamBuffer: {
      reset: () => { buffer = ''; },
      getBufferedContent: () => buffer,
      appendToken: (token, flush) => { buffer += token; flush(buffer); },
    },
    submitInFlightRef,
    messagesEndRef: { current: null },
    setTimeout() {},
    setChatState() {},
    setErrorMessage() {},
    isOpen: false,
    RAG_QUERY_CLIENT_TIMEOUT_MS: 20_000,
    withTimeout: promise => promise,
    genMessageId: () => String(++nextMessageId),
    setMessages: update => { rendererMessages = update(rendererMessages); },
  });
  const invoke = name => vm.runInContext(ts.transpileModule(
    `(${callbacks.get(name)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText, context);

  const submit = invoke('submitQuestion');
  const obsolete = submit('first request');
  const staleChunk = [...listeners.chunk][0];
  invoke('closeEffect')();
  const replacement = submit('replacement request');
  const owner = submitInFlightRef.current;
  const currentChunk = [...listeners.chunk].at(-1);
  const currentDone = [...listeners.done].at(-1);
  currentChunk({ chunk: 'Replacement answer', global: true });
  staleChunk({ chunk: 'obsolete output', global: true });

  requests.get('first request')({ success: true });
  await obsolete;
  assert.equal(submitInFlightRef.current, owner);
  assert.equal(buffer, 'Replacement answer');
  await submit('repeated Enter');
  assert.equal(requests.size, 2);
  currentDone();
  assert.equal(rendererMessages.at(-1).isStreaming, true);
  currentDone({ global: true });
  requests.get('replacement request')({ success: true });
  await replacement;
  assert.equal(rendererMessages.at(-1).content, 'Replacement answer');
  assert.equal(rendererMessages.at(-1).isStreaming, false);
  assert.equal(submitInFlightRef.current, null);
  assert.equal(listeners.chunk.size + listeners.done.size + listeners.error.size, 0);
});
