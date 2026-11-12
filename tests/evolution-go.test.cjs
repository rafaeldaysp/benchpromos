const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

/** Fake Evolution Go endpoint: records each request and replies with a fixed body. */
class FakeEvolutionGoServer {
  constructor(body, status = 200) {
    this.body = body
    this.status = status
    this.requests = []
    this.fetch = async (url, init) => {
      this.requests.push({ url, init })
      return new Response(JSON.stringify(this.body), { status: this.status })
    }
  }

  get lastJson() {
    return JSON.parse(this.requests.at(-1).init.body)
  }
}

function load(env, fetchFn) {
  const source = readFileSync('src/lib/evolution-go.ts', 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const module = { exports: {} }
  runInNewContext(outputText, {
    module, exports: module.exports, fetch: fetchFn, AbortSignal, Response, JSON, FormData, Blob,
    require: (name) => { if (name === '@/env.mjs') return { env }; throw new Error(name) },
  })
  return module.exports
}

const base = { EVOLUTION_GO_URL: 'https://wa.test', EVOLUTION_GO_INSTANCE_TOKEN: 'token' }
const sent = { message: 'success', data: { Info: { ID: '3EB0ABC' } } }

test('parses a comma-separated chat list, trimming blanks and duplicates', () => {
  const { getEvolutionGoServerConfig } = load({
    ...base,
    WHATSAPP_CHAT_IDS: ' 1@g.us, 2@newsletter,,1@g.us ,',
  })
  assert.deepEqual([...getEvolutionGoServerConfig().chatIds], ['1@g.us', '2@newsletter'])
})

test('stays dark without at least one chat id', () => {
  const { getEvolutionGoServerConfig } = load({ ...base, WHATSAPP_CHAT_IDS: ' , ' })
  assert.equal(getEvolutionGoServerConfig(), null)
  assert.equal(load(base).getEvolutionGoServerConfig(), null)
})

test('stays dark without the instance token', () => {
  const env = { EVOLUTION_GO_URL: 'https://wa.test', WHATSAPP_CHAT_IDS: '1@g.us' }
  assert.equal(load(env).getEvolutionGoServerConfig(), null)
})

test('sendMedia maps to /send/media with url/type and the instance token', async () => {
  const server = new FakeEvolutionGoServer(sent)
  const { createEvolutionGoClient } = load(base, server.fetch)
  const client = createEvolutionGoClient({ apiUrl: 'https://wa.test/', instanceToken: 'token' })

  const result = await client.sendMedia({
    number: '120363426558017946@newsletter',
    media: 'https://cdn.test/a.jpg',
    caption: 'oferta',
  })

  assert.equal(server.requests[0].url, 'https://wa.test/send/media')
  assert.equal(server.requests[0].init.headers.apikey, 'token')
  assert.deepEqual(server.lastJson, {
    number: '120363426558017946@newsletter',
    type: 'image',
    url: 'https://cdn.test/a.jpg',
    caption: 'oferta',
  })
  assert.equal(result.data.Info.ID, '3EB0ABC')
})

test('connectionState is open only when connected and paired', async () => {
  const cases = [
    [{ Connected: true, LoggedIn: true }, 'open'],
    [{ Connected: true, LoggedIn: false }, 'qr-code'],
    [{ Connected: false, LoggedIn: false }, 'closed'],
  ]
  for (const [status, expected] of cases) {
    const server = new FakeEvolutionGoServer({ message: 'success', data: status })
    const { createEvolutionGoClient } = load(base, server.fetch)
    const client = createEvolutionGoClient({ apiUrl: 'https://wa.test', instanceToken: 'token' })
    assert.equal(await client.connectionState(), expected)
  }
})

test('surfaces the provider error text with a retryable flag', async () => {
  const server = new FakeEvolutionGoServer({ error: 'websocket disconnected' }, 500)
  const { createEvolutionGoClient } = load(base, server.fetch)
  const client = createEvolutionGoClient({ apiUrl: 'https://wa.test', instanceToken: 'token' })

  await assert.rejects(client.sendText({ number: '+55 11 99999-8888', text: 'oi' }), (error) => {
    assert.equal(error.message, 'websocket disconnected')
    assert.equal(error.status, 500)
    assert.equal(error.retryable, true)
    return true
  })
  assert.equal(server.lastJson.number, '5511999998888')
})

test('the tech target reads WHATSAPP_TECH_CHAT_IDS, not the general list', () => {
  const { getEvolutionGoServerConfig } = load({
    ...base,
    WHATSAPP_CHAT_IDS: '1@newsletter',
    WHATSAPP_TECH_CHAT_IDS: ' 2@newsletter, 3@g.us ',
  })
  assert.deepEqual([...getEvolutionGoServerConfig('tech').chatIds], ['2@newsletter', '3@g.us'])
  assert.deepEqual([...getEvolutionGoServerConfig().chatIds], ['1@newsletter'])
})

test('the tech target stays dark when only the general list is set', () => {
  const { getEvolutionGoServerConfig } = load({ ...base, WHATSAPP_CHAT_IDS: '1@newsletter' })
  assert.equal(getEvolutionGoServerConfig('tech'), null)
})

test('sendMediaFile uploads the bytes as multipart to /send/media', async () => {
  const server = new FakeEvolutionGoServer(sent)
  const { createEvolutionGoClient } = load(base, server.fetch)
  const client = createEvolutionGoClient({ apiUrl: 'https://wa.test', instanceToken: 'token' })

  await client.sendMediaFile({
    number: '120363426558017946@newsletter',
    file: Buffer.from([0xff, 0xd8, 0xff]),
    caption: 'oferta',
  })

  const { url, init } = server.requests[0]
  assert.equal(url, 'https://wa.test/send/media')
  assert.equal(init.headers.apikey, 'token')
  assert.equal(init.headers['Content-Type'], undefined)
  assert.equal(init.body.get('number'), '120363426558017946@newsletter')
  assert.equal(init.body.get('type'), 'image')
  assert.equal(init.body.get('caption'), 'oferta')
  const file = init.body.get('file')
  assert.equal(file.size, 3)
  assert.equal(file.type, 'image/jpeg')
  assert.equal(file.name, 'image.jpg')
})
