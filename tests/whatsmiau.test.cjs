const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

function load(env) {
  const source = readFileSync('src/lib/whatsmiau.ts', 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const module = { exports: {} }
  runInNewContext(outputText, {
    module, exports: module.exports,
    require: (name) => { if (name === '@/env.mjs') return { env }; throw new Error(name) },
  })
  return module.exports
}

const base = { WHATSMIAU_API_URL: 'https://api', WHATSMIAU_API_KEY: 'key', WHATSMIAU_INSTANCE: 'inst' }

test('parses a comma-separated chat list, trimming blanks and duplicates', () => {
  const { getWhatsmiauServerConfig } = load({
    ...base,
    WHATSMIAU_CHAT_IDS: ' 1@g.us, 2@g.us,,1@g.us ,',
  })
  assert.deepEqual([...getWhatsmiauServerConfig().chatIds], ['1@g.us', '2@g.us'])
})

test('stays dark without at least one chat id', () => {
  const { getWhatsmiauServerConfig } = load({ ...base, WHATSMIAU_CHAT_IDS: ' , ' })
  assert.equal(getWhatsmiauServerConfig(), null)
  assert.equal(load(base).getWhatsmiauServerConfig(), null)
})
