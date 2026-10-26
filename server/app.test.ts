import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createApp } from './app.ts'

const INDEX_HTML = '<!doctype html><title>La Thibaudière</title>'
const ASSET_JS = 'console.log("bundle")'

// A stand-in for the built `dist/`.
function fakeDist() {
  const root = mkdtempSync(join(tmpdir(), 'thibaudiere-dist-'))
  writeFileSync(join(root, 'index.html'), INDEX_HTML)
  mkdirSync(join(root, 'assets'))
  writeFileSync(join(root, 'assets', 'index-abc123.js'), ASSET_JS)
  return root
}

test('GET /api/health returns 200', async () => {
  const app = createApp()
  const res = await app.request('/api/health')
  assert.equal(res.status, 200)
})

test('a deep link is answered with the SPA', async () => {
  const app = createApp({ staticRoot: fakeDist() })
  const res = await app.request('/profile')
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type') ?? '', /text\/html/)
  assert.equal(await res.text(), INDEX_HTML)
})

test('an unknown /api route is a 404, not the SPA', async () => {
  const app = createApp({ staticRoot: fakeDist() })
  const res = await app.request('/api/nope')
  assert.equal(res.status, 404)
  assert.notEqual(await res.text(), INDEX_HTML)
})

test('every response carries the security headers', async () => {
  const app = createApp({ staticRoot: fakeDist() })
  for (const path of ['/api/health', '/profile']) {
    const res = await app.request(path)
    assert.equal(res.headers.get('x-frame-options'), 'DENY', path)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff', path)
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', path)
    assert.equal(
      res.headers.get('permissions-policy'),
      'camera=(), microphone=(), geolocation=()',
      path,
    )
    assert.equal(
      res.headers.get('content-security-policy-report-only'),
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.open-meteo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      path,
    )
  }
})

test('a built asset is served as itself', async () => {
  const app = createApp({ staticRoot: fakeDist() })
  const res = await app.request('/assets/index-abc123.js')
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type') ?? '', /javascript/)
  assert.equal(await res.text(), ASSET_JS)
})
