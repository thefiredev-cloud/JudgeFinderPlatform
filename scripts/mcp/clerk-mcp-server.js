#!/usr/bin/env node
'use strict'

// Minimal MCP server over stdio implementing initialize, tools/list, tools/call for Clerk Admin API
// Env: CLERK_SECRET_KEY (required), NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (optional)

// Ensure fetch is available in all Node runtimes
try {
  if (typeof fetch !== 'function') {
    // Prefer undici which is supported in CommonJS
    const { fetch: undiciFetch } = require('undici')
    global.fetch = undiciFetch
  }
} catch (_) {
  // If undici is not available, keep going; runtime may provide global fetch
}

const { stdin, stdout } = process

const SERVER_INFO = { name: 'clerk-mcp-local', version: '0.1.0' }
const PROTOCOL_VERSION = '2024-11-05'

// ---- JSON-RPC over stdio framing (Content-Length) ----
let readBuffer = Buffer.alloc(0)

stdin.on('data', (chunk) => {
  readBuffer = Buffer.concat([readBuffer, chunk])
  processBuffer()
})

function processBuffer() {
  while (true) {
    const headerEnd = readBuffer.indexOf('\r\n\r\n')
    if (headerEnd === -1) return
    const header = readBuffer.slice(0, headerEnd).toString('utf8')
    const match = /Content-Length:\s*(\d+)/i.exec(header)
    if (!match) {
      // Drop invalid header
      readBuffer = readBuffer.slice(headerEnd + 4)
      continue
    }
    const contentLength = parseInt(match[1], 10)
    const totalLength = headerEnd + 4 + contentLength
    if (readBuffer.length < totalLength) return
    const body = readBuffer.slice(headerEnd + 4, totalLength).toString('utf8')
    readBuffer = readBuffer.slice(totalLength)
    try {
      const message = JSON.parse(body)
      handleMessage(message)
    } catch (e) {
      // ignore invalid json
    }
  }
}

function send(message) {
  const body = JSON.stringify(message)
  stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n`)
  stdout.write(body)
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function error(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, data } })
}

// ---- Clerk REST helpers ----
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || process.env.CLERK_API_KEY

async function clerkFetch(path, options = {}) {
  const url = `https://api.clerk.com${path}`
  const headers = Object.assign(
    {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    options.headers || {}
  )
  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = { raw: text } }
  if (!res.ok) {
    throw new Error(`Clerk API error ${res.status}: ${JSON.stringify(json)}`)
  }
  return json
}

// ---- Tools ----
const tools = [
  {
    name: 'clerk.listUsers',
    description: 'List Clerk users. Optional: limit (1-100), query (email substring).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        query: { type: 'string' }
      },
      required: []
    },
    run: async (args = {}) => {
      const params = new URLSearchParams()
      if (args.limit) params.set('limit', String(args.limit))
      if (args.query) params.set('query', String(args.query))
      return await clerkFetch(`/v1/users${params.toString() ? `?${params.toString()}` : ''}`)
    }
  },
  {
    name: 'clerk.getUser',
    description: 'Get a Clerk user by user_id.',
    inputSchema: {
      type: 'object',
      properties: { user_id: { type: 'string' } },
      required: ['user_id']
    },
    run: async (args) => {
      return await clerkFetch(`/v1/users/${encodeURIComponent(args.user_id)}`)
    }
  },
  {
    name: 'clerk.createUser',
    description: 'Create a Clerk user with email_address and optional first_name, last_name.',
    inputSchema: {
      type: 'object',
      properties: {
        email_address: { type: 'string' },
        first_name: { type: 'string' },
        last_name: { type: 'string' }
      },
      required: ['email_address']
    },
    run: async (args) => {
      const body = {
        email_address: [String(args.email_address)],
        first_name: args.first_name || undefined,
        last_name: args.last_name || undefined
      }
      return await clerkFetch('/v1/users', { method: 'POST', body: JSON.stringify(body) })
    }
  },
  {
    name: 'clerk.updateUser',
    description: 'Update a Clerk user by user_id with optional fields (first_name, last_name, banned).',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        banned: { type: 'boolean' }
      },
      required: ['user_id']
    },
    run: async (args) => {
      const body = {}
      if (args.first_name !== undefined) body.first_name = String(args.first_name)
      if (args.last_name !== undefined) body.last_name = String(args.last_name)
      if (args.banned !== undefined) body.banned = Boolean(args.banned)
      return await clerkFetch(`/v1/users/${encodeURIComponent(args.user_id)}`, { method: 'PATCH', body: JSON.stringify(body) })
    }
  },
  {
    name: 'clerk.deleteUser',
    description: 'Delete a Clerk user by user_id.',
    inputSchema: {
      type: 'object',
      properties: { user_id: { type: 'string' } },
      required: ['user_id']
    },
    run: async (args) => {
      return await clerkFetch(`/v1/users/${encodeURIComponent(args.user_id)}`, { method: 'DELETE' })
    }
  },
  {
    name: 'clerk.listOrganizations',
    description: 'List Clerk organizations. Optional: limit (1-100), query (name/email).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        query: { type: 'string' }
      },
      required: []
    },
    run: async (args = {}) => {
      const params = new URLSearchParams()
      if (args.limit) params.set('limit', String(args.limit))
      if (args.query) params.set('query', String(args.query))
      return await clerkFetch(`/v1/organizations${params.toString() ? `?${params.toString()}` : ''}`)
    }
  }
]

function handleMessage(msg) {
  const { id, method, params } = msg
  if (!method) return

  try {
    switch (method) {
      case 'initialize': {
        reply(id, {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: { tools: { listChanged: false } }
        })
        break
      }
      case 'notifications/initialized': {
        // Notification, no response required
        break
      }
      case 'tools/list': {
        reply(id, { tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) })
        break
      }
      case 'tools/call': {
        const name = params?.name
        const args = params?.arguments || {}
        const tool = tools.find(t => t.name === name)
        if (!tool) return error(id, -32601, `Unknown tool: ${name}`)
        if (!CLERK_SECRET_KEY) return error(id, -32000, 'CLERK_SECRET_KEY is not set')
        Promise.resolve(tool.run(args))
          .then((res) => reply(id, { content: [{ type: 'json', json: res }] }))
          .catch((e) => error(id, -32000, e.message))
        break
      }
      case 'ping': {
        reply(id, {})
        break
      }
      case 'shutdown': {
        reply(id, {})
        process.exit(0)
        break
      }
      default: {
        // If this was a notification (no id), ignore silently per JSON-RPC
        if (id === undefined || id === null) return
        error(id, -32601, `Unknown method: ${method}`)
      }
    }
  } catch (e) {
    error(id, -32000, e?.message || 'Unhandled server error')
  }
}

// Keep process alive
stdin.resume()


