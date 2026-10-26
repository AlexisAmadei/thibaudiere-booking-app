import assert from 'node:assert/strict'
import { createServer, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { test, type TestContext } from 'node:test'
import { s3Store, s3StoreFromEnv } from './s3.ts'

const CREDENTIALS = { bucket: 'thibaudiere-backups', accessKeyId: 'test-key-id', secretAccessKey: 'test-secret' }

// Enough of the S3 API for the store, as R2 answers it: path-style object requests and
// ListObjectsV2, two keys per page so listing has to follow continuation tokens. Records
// every request. It checks that requests are signed, not that the signatures are right.
async function fakeS3(t: TestContext) {
  const objects = new Map<string, Buffer>()
  const requests: { method: string; url: string; authorization: string }[] = []
  const server = createServer(async (req, res) => {
    const body = Buffer.concat(await Array.fromAsync(req as AsyncIterable<Buffer>))
    requests.push({ method: req.method!, url: req.url!, authorization: req.headers.authorization ?? '' })
    if (!req.headers.authorization?.startsWith('AWS4-HMAC-SHA256 ')) return reply(res, 403, '<Error><Code>AccessDenied</Code></Error>')

    const url = new URL(req.url!, 'http://s3')
    const [, bucket, ...rest] = url.pathname.split('/')
    if (bucket !== CREDENTIALS.bucket) return reply(res, 404, '<Error><Code>NoSuchBucket</Code></Error>')
    const key = decodeURIComponent(rest.join('/'))

    if (req.method === 'GET' && !key && url.searchParams.get('list-type') === '2') {
      const prefix = url.searchParams.get('prefix') ?? ''
      const all = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort()
      const start = Number(url.searchParams.get('continuation-token') ?? 0)
      const page = all.slice(start, start + 2)
      const truncated = start + 2 < all.length
      return reply(
        res,
        200,
        `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>${bucket}</Name>` +
          page.map((k) => `<Contents><Key>${k.replaceAll('&', '&amp;')}</Key><Size>1</Size></Contents>`).join('') +
          `<IsTruncated>${truncated}</IsTruncated>` +
          (truncated ? `<NextContinuationToken>${start + 2}</NextContinuationToken>` : '') +
          '</ListBucketResult>',
      )
    }
    if (req.method === 'PUT') {
      objects.set(key, body)
      return reply(res, 200, '')
    }
    if (req.method === 'GET') {
      const object = objects.get(key)
      return object ? reply(res, 200, object) : reply(res, 404, '<Error><Code>NoSuchKey</Code></Error>')
    }
    if (req.method === 'DELETE') {
      objects.delete(key)
      return reply(res, 204, '')
    }
    reply(res, 400, '<Error><Code>BadRequest</Code></Error>')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  return { endpoint, objects, requests }
}

function reply(res: ServerResponse, status: number, body: string | Buffer) {
  res.writeHead(status, { 'content-type': 'application/xml' }).end(body)
}

test('objects put in the bucket can be listed, across pages, fetched and deleted', async (t) => {
  const { endpoint } = await fakeS3(t)
  const store = s3Store({ endpoint, ...CREDENTIALS })
  const keys = ['backups/a.sqlite.gz', 'backups/b.sqlite.gz', 'backups/c&d.sqlite.gz', 'exports/e.sqlite.gz']
  for (const key of keys) await store.put(key, new TextEncoder().encode(key))

  assert.deepEqual(await store.list('backups/'), keys.slice(0, 3))
  assert.equal(new TextDecoder().decode(await store.get('backups/b.sqlite.gz')), 'backups/b.sqlite.gz')

  await store.delete('backups/a.sqlite.gz')
  assert.deepEqual(await store.list('backups/'), keys.slice(1, 3))
})

test('requests are signed for R2 and address the bucket in the path', async (t) => {
  const { endpoint, objects, requests } = await fakeS3(t)
  // R2's endpoint is the account's, so the bucket goes in the path; a trailing slash is fine.
  const store = s3Store({ endpoint: `${endpoint}/`, ...CREDENTIALS })

  await store.put('backups/2026-10-26T031507Z.sqlite.gz', new Uint8Array([1, 2, 3]))

  assert.deepEqual([...objects], [['backups/2026-10-26T031507Z.sqlite.gz', Buffer.from([1, 2, 3])]])
  assert.equal(requests[0].url, '/thibaudiere-backups/backups/2026-10-26T031507Z.sqlite.gz')
  assert.match(requests[0].authorization, /^AWS4-HMAC-SHA256 Credential=test-key-id\/\d{8}\/auto\/s3\/aws4_request,/)
})

test('a request the bucket refuses fails with its status and reason', async (t) => {
  const { endpoint } = await fakeS3(t)

  await assert.rejects(s3Store({ endpoint, ...CREDENTIALS }).get('backups/absent.sqlite.gz'), /404.*NoSuchKey/)
  await assert.rejects(s3Store({ endpoint, ...CREDENTIALS, bucket: 'autre' }).list('backups/'), /404.*NoSuchBucket/)
})

test('an unreachable bucket fails with why, not just "fetch failed"', async () => {
  // A port that was just free, so nothing listens on it.
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  await new Promise((resolve) => server.close(resolve))
  const store = s3Store({ endpoint: `http://127.0.0.1:${port}`, ...CREDENTIALS })

  await assert.rejects(store.list('backups/'), new RegExp(`S3 GET http://127.0.0.1:${port}/thibaudiere-backups\\?.* failed: .*ECONNREFUSED`))
})

test('the store is configured from the S3_ variables, and names the ones that are missing', async (t) => {
  const { endpoint } = await fakeS3(t)
  const env = { S3_ENDPOINT: endpoint, S3_BUCKET: CREDENTIALS.bucket, S3_ACCESS_KEY_ID: 'test-key-id', S3_SECRET_ACCESS_KEY: '' }

  assert.throws(() => s3StoreFromEnv({ S3_ENDPOINT: endpoint }), /S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/)
  assert.throws(() => s3StoreFromEnv(env), /Missing S3_SECRET_ACCESS_KEY\b/)

  const store = s3StoreFromEnv({ ...env, S3_SECRET_ACCESS_KEY: 'test-secret' })
  await store.put('backups/x.sqlite.gz', new Uint8Array([1]))
  assert.deepEqual(await store.list('backups/'), ['backups/x.sqlite.gz'])
})
