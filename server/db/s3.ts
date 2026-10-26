import { AwsClient } from 'aws4fetch'
import type { BackupStore } from './backups.ts'

// The backup bucket in Cloudflare R2, through its S3-compatible API. aws4fetch only signs the
// requests (SigV4) for `fetch`, where the AWS SDK would bring a large dependency tree for four
// calls.

interface S3Options {
  // R2: https://<account id>.r2.cloudflarestorage.com, the bucket goes in the path.
  endpoint: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export function s3Store({ endpoint, bucket, accessKeyId, secretAccessKey }: S3Options): BackupStore {
  // R2's region is always `auto`. Retries 5xx answers with backoff (aws4fetch's default).
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
  const bucketUrl = `${endpoint.replace(/\/+$/, '')}/${encodeURIComponent(bucket)}`
  const objectUrl = (key: string) => `${bucketUrl}/${key.split('/').map(encodeURIComponent).join('/')}`

  async function send(method: string, url: string, body?: Uint8Array) {
    const failed = `S3 ${method} ${url} failed`
    // `fetch` rejects with only "fetch failed"; the reason (DNS, refused…) is its cause.
    const res = await client.fetch(url, { method, body }).catch((error: Error) => {
      throw new Error(`${failed}: ${error.cause instanceof Error ? error.cause.message : error.message}`, { cause: error })
    })
    if (!res.ok) throw new Error(`${failed}: ${res.status} ${(await res.text()).slice(0, 500)}`)
    return res
  }

  return {
    // ListObjectsV2 answers at most 1000 keys at a time.
    async list(prefix) {
      const keys: string[] = []
      let token: string | undefined
      do {
        const url = new URL(bucketUrl)
        url.searchParams.set('list-type', '2')
        url.searchParams.set('prefix', prefix)
        if (token) url.searchParams.set('continuation-token', token)
        const xml = await (await send('GET', url.href)).text()
        keys.push(...Array.from(xml.matchAll(/<Key>(.*?)<\/Key>/g), ([, key]) => unescapeXml(key)))
        const next = /<IsTruncated>true<\/IsTruncated>/.test(xml) && /<NextContinuationToken>(.*?)<\/NextContinuationToken>/.exec(xml)
        token = next ? unescapeXml(next[1]) : undefined
      } while (token)
      return keys
    },
    async put(key, body) {
      await send('PUT', objectUrl(key), body)
    },
    async get(key) {
      return new Uint8Array(await (await send('GET', objectUrl(key))).arrayBuffer())
    },
    async delete(key) {
      await send('DELETE', objectUrl(key))
    },
  }
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
function unescapeXml(text: string) {
  return text.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_ENTITIES[name])
}

const VARIABLES = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const

// The bucket named by S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.
export function s3StoreFromEnv(env: Record<string, string | undefined> = process.env) {
  const missing = VARIABLES.filter((name) => !env[name])
  if (missing.length) throw new Error(`Missing ${missing.join(', ')}: the backup bucket is configured from the environment.`)
  return s3Store({
    endpoint: env.S3_ENDPOINT!,
    bucket: env.S3_BUCKET!,
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
  })
}
