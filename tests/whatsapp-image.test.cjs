const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')
const sharp = require('sharp')

/** Fake image host: serves fixed bytes (or a status) for any URL. */
class FakeImageHost {
  constructor(bytes, status = 200) {
    this.bytes = bytes
    this.status = status
    this.fetch = async () => new Response(this.bytes, { status: this.status })
  }
}

function load(fetchFn) {
  const source = readFileSync('src/lib/whatsapp-image.ts', 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  })
  const module = { exports: {} }
  const errors = []
  runInNewContext(outputText, {
    module, exports: module.exports, fetch: fetchFn, AbortSignal, Response, Buffer, Math,
    console: { error: (...args) => errors.push(args) },
    require: (name) => { if (name === 'sharp') return sharp; throw new Error(name) },
  })
  return { ...module.exports, errors }
}

/** Portrait photo: a light product shape on a uniform backdrop colour. */
function portraitPhoto(backdrop, width = 200, height = 400) {
  const product = { create: { width: 100, height: 300, channels: 3, background: '#d0d0d0' } }
  return sharp({ create: { width, height, channels: 3, background: backdrop } })
    .composite([{ input: { ...product }, left: 50, top: 50 }])
    .jpeg()
    .toBuffer()
}

function pixelAt(raw, info, x, y) {
  const offset = (y * info.width + x) * info.channels
  return [raw[offset], raw[offset + 1], raw[offset + 2]]
}

function assertClose(actual, expected, tolerance = 6) {
  actual.forEach((value, index) =>
    assert.ok(Math.abs(value - expected[index]) <= tolerance, `${actual} vs ${expected}`),
  )
}

test('frames a portrait photo into a square filled with its corner colour', async () => {
  const { frameImageSquare } = load()
  const framed = await frameImageSquare(await portraitPhoto('#202020'))

  const { data, info } = await sharp(framed).raw().toBuffer({ resolveWithObject: true })
  assert.equal(info.width, 400)
  assert.equal(info.height, 400)
  assertClose(pixelAt(data, info, 0, 200), [0x20, 0x20, 0x20])
  assertClose(pixelAt(data, info, 399, 200), [0x20, 0x20, 0x20])
})

test('caps the square side at 1280px', async () => {
  const { frameImageSquare } = load()
  const framed = await frameImageSquare(await portraitPhoto('#ffffff', 1000, 2000))
  const { width, height } = await sharp(framed).metadata()
  assert.equal(width, 1280)
  assert.equal(height, 1280)
})

test('samples a white backdrop from typical store photos', async () => {
  const { sampleCornerColor } = load()
  // Spread: the result comes from the vm realm, so copy it into a plain object.
  const color = { ...(await sampleCornerColor(await portraitPhoto('#ffffff'))) }
  assert.deepEqual(color, { r: 255, g: 255, b: 255 })
})

test('prepareSquareWhatsappImage returns a square JPEG from a URL', async () => {
  const host = new FakeImageHost(await portraitPhoto('#ffffff'))
  const { prepareSquareWhatsappImage } = load(host.fetch)
  const framed = await prepareSquareWhatsappImage('https://cdn.test/a.jpg')
  const { width, height, format } = await sharp(framed).metadata()
  assert.deepEqual([width, height, format], [400, 400, 'jpeg'])
})

test('prepareSquareWhatsappImage returns null (fallback to URL) when the download fails', async () => {
  const host = new FakeImageHost('missing', 404)
  const loaded = load(host.fetch)
  assert.equal(await loaded.prepareSquareWhatsappImage('https://cdn.test/missing.jpg'), null)
  assert.match(loaded.errors[0][1].error, /status=404/)
})
