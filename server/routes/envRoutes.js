const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()

const envPath = path.join(__dirname, '..', '.env')

function isLocalRequest(req) {
  const ip = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '')
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

router.use((req, res, next) => {
  if (!isLocalRequest(req)) return res.status(403).json({ message: 'Forbidden: env editing allowed only from localhost' })
  next()
})

router.get('/', (req, res) => {
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    const lines = content.split(/\r?\n/)
    const kv = {}
    lines.forEach(l => {
      if (!l || l.trim().startsWith('#')) return
      const idx = l.indexOf('=')
      if (idx === -1) return
      const key = l.slice(0, idx)
      const val = l.slice(idx + 1)
      kv[key] = val
    })
    res.json({ env: kv })
  } catch (err) {
    res.status(500).json({ message: 'Failed to read .env', error: err.message })
  }
})

router.post('/', express.json(), (req, res) => {
  const updates = req.body || {}
  try {
    const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
    const lines = content.split(/\r?\n/)
    const out = []
    const handled = new Set()
    lines.forEach(l => {
      if (!l || l.trim().startsWith('#')) { out.push(l); return }
      const idx = l.indexOf('=')
      if (idx === -1) { out.push(l); return }
      const key = l.slice(0, idx)
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        out.push(`${key}=${updates[key]}`)
        handled.add(key)
      } else {
        out.push(l)
      }
    })
    // append any new keys
    Object.keys(updates).forEach(k => { if (!handled.has(k)) out.push(`${k}=${updates[k]}`) })
    fs.writeFileSync(envPath, out.join('\n'))
    res.json({ message: 'Updated .env locally' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to write .env', error: err.message })
  }
})

module.exports = router
