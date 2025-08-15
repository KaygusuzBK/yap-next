import crypto from 'node:crypto'

export function verifyGitHubSignature(rawBody: string, signature256: string | null, secret: string): boolean {
  if (!signature256) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return timingSafeEqual(expected, signature256)
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function readRawBody(req: Request): Promise<string> {
  const buf = await req.arrayBuffer()
  return Buffer.from(buf).toString('utf8')
}


