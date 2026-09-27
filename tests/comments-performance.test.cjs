const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')
const apollo = require('@apollo/client')

const comment = (id) => ({
  __typename: 'Comment', id, text: id, createdAt: '2026-01-01', updatedAt: null,
  saleId: 'sale', replyToId: null,
  user: { __typename: 'User', id: 'user', role: 'USER', name: 'User', image: null },
  likes: [], likesCount: 0, repliesCount: 0,
})
function harness({ replyToId } = {}) {
  const cache = new apollo.InMemoryCache()
  const slots = []
  let cursor = 0, document, variables, options, fail = false, barrier
  const requests = [], toasts = [], mutations = []
  const pages = new Map([[2, Array.from({ length: 20 }, (_, i) => comment(`c${i + 20}`))], [3, [comment('last')]]])
  const client = { cache }
  const source = readFileSync('src/hooks/use-comments.ts', 'utf8')
  const exports = {}
  const mocks = {
    react: {
      useState(value) { const index = cursor++; if (!(index in slots)) slots[index] = value; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }] },
      useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
      useEffect(fn, deps) { const index = cursor++; if (!slots[index] || deps.some((x, i) => x !== slots[index][i])) { slots[index] = deps; fn() } },
    },
    '@apollo/client': {
      gql: apollo.gql,
      useMutation(doc, config) {
        mutations.push({ doc, config })
        return [async () => {
          const result = { data: { comment: { ...comment('new'), replyToId: replyToId ?? null } } }
          config.update(cache, result)
          return result
        }, { loading: false }]
      },
    },
    '@apollo/experimental-nextjs-app-support/ssr': {
      useQuery(doc, opts) {
        document = doc; variables = opts.variables; options = opts
        return { client, data: cache.readQuery({ query: doc, variables }), loading: false,
          fetchMore: async (request) => {
            requests.push(request.variables)
            if (barrier) await barrier
            if (fail) throw new Error('network failure')
            const data = { comments: pages.get(request.variables.input.paginationInput.page) ?? [] }
            const previous = cache.readQuery({ query: doc, variables })
            cache.writeQuery({ query: doc, variables, data: request.updateQuery(previous, { fetchMoreResult: data }) })
            return { data }
          },
          refetch: async () => {},
        }
      },
    },
    sonner: { toast: { error: (message) => toasts.push(message) } },
    zustand: { create: (init) => { const state = init(() => {}); return () => state } },
    '@/app/_actions/user': { getCurrentUserToken: async () => 'synthetic-token' },
  }
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, require: id => mocks[id], Map, Set, Promise })
  function render(fetchComments = true) { cursor = 0; return exports.useComments({ saleId: 'sale', replyToId, fetchComments }) }
  render()
  function seed(comments = Array.from({ length: 20 }, (_, i) => comment(`c${i}`))) { cache.writeQuery({ query: document, variables, data: { comments } }) }
  return { render, seed, cache, requests, pages, toasts, get options() { return options }, set fail(value) { fail = value }, set barrier(value) { barrier = value } }
}

test('requests 20 comments and action-only consumers skip reads', () => {
  const h = harness()
  assert.equal(h.options.variables.input.paginationInput.limit, 20)
  assert.equal(h.options.variables.input.paginationInput.page, 1)
  h.render(false)
  assert.equal(h.options.skip, true)
})
test('appends pages, deduplicates overlapping IDs, and stops after a short page', async () => {
  const h = harness(); h.seed()
  h.pages.get(2)[0] = comment('c19')
  await h.render().loadMore()
  assert.equal(h.render().comments.length, 39)
  assert.equal(h.render().hasMore, true)
  await h.render().loadMore()
  assert.equal(h.render().comments.length, 40)
  assert.equal(h.render().hasMore, false)
  assert.deepEqual(h.requests.map(x => x.input.paginationInput.page), [2, 3])
})
test('double clicks share the in-flight guard; failures retry the same page', async () => {
  const h = harness(); h.seed()
  let release
  h.barrier = new Promise(resolve => { release = resolve })
  const hook = h.render()
  const first = hook.loadMore()
  await hook.loadMore()
  assert.equal(h.requests.length, 1)
  h.fail = true; release(); await first
  assert.equal(h.toasts.length, 1)
  h.fail = false; h.barrier = undefined
  await h.render().loadMore()
  assert.deepEqual(h.requests.map(x => x.input.paginationInput.page), [2, 2])
  assert.equal(h.render().comments.length, 40)
})
test('new comments update the same paginated Apollo cache used by the list', async () => {
  const h = harness(); h.seed()
  await h.render(false).createComment({ text: 'new' })
  assert.equal(h.render().comments.length, 21)
  assert.equal(h.render().comments[0].id, 'new')
})
test('a reply updates its parent count even before the reply list is opened', async () => {
  const h = harness({ replyToId: 'parent' })
  const fragment = apollo.gql`fragment ParentCount on Comment { id repliesCount }`
  h.cache.writeFragment({ id: 'Comment:parent', fragment, data: { __typename: 'Comment', id: 'parent', repliesCount: 5 } })
  await h.render(false).createComment({ text: 'new' })
  assert.equal(h.cache.readFragment({ id: 'Comment:parent', fragment }).repliesCount, 6)
})
