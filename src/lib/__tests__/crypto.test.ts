import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { encryptSecret, decryptSecret } from '../crypto'

describe('crypto encrypt/decrypt', () => {
  const prev = process.env.WEBHOOK_ENC_KEY
  beforeAll(() => {
    // 32-byte key in base64
    process.env.WEBHOOK_ENC_KEY = Buffer.from('k'.repeat(32)).toString('base64')
  })
  afterAll(() => {
    if (prev === undefined) delete process.env.WEBHOOK_ENC_KEY
    else process.env.WEBHOOK_ENC_KEY = prev
  })

  it('roundtrips plaintext', () => {
    const msg = 'merhaba dünya'
    const enc = encryptSecret(msg)
    const dec = decryptSecret(enc)
    expect(dec).toBe(msg)
  })
})


