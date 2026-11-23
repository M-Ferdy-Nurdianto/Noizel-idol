import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authMiddleware } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'noize-super-secret-jwt-token-with-at-least-32-characters-long'
process.env.JWT_SECRET = JWT_SECRET

test('Guest token on GET request is allowed (read-only)', (t) => {
  let passed = false
  const req = { headers: { authorization: 'Bearer demo_guest_token_noize_2026' }, method: 'GET' }
  const res = {}
  authMiddleware(req, res, () => { passed = true })
  assert.equal(passed, true)
  assert.equal(req.user.role, 'guest')
})

test('Guest token on POST/PUT/DELETE request is rejected with 403', (t) => {
  ['POST', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
    let statusCode = 200
    let resJson = null
    const req = { headers: { authorization: 'Bearer demo_guest_token_noize_2026' }, method }
    const res = {
      status(code) { statusCode = code; return this },
      json(data) { resJson = data; return this }
    }
    let passed = false
    authMiddleware(req, res, () => { passed = true })
    assert.equal(passed, false, `Method ${method} should not have passed`)
    assert.equal(statusCode, 403)
    assert.match(resJson.error, /read-only/i)
  })
})

test('Invalid token is rejected with 401', (t) => {
  let statusCode = 200
  let resJson = null
  const req = { headers: { authorization: 'Bearer invalid_hacker_token' }, method: 'POST' }
  const res = {
    status(code) { statusCode = code; return this },
    json(data) { resJson = data; return this }
  }
  let passed = false
  authMiddleware(req, res, () => { passed = true })
  assert.equal(passed, false)
  assert.equal(statusCode, 401)
})

test('Valid Admin JWT token is allowed on POST', (t) => {
  let passed = false
  const adminToken = jwt.sign({ id: 'admin-id', username: 'admin', role: 'admin' }, JWT_SECRET)
  const req = { headers: { authorization: `Bearer ${adminToken}` }, method: 'POST' }
  const res = {}
  authMiddleware(req, res, () => { passed = true })
  assert.equal(passed, true)
  assert.equal(req.user.username, 'admin')
})
