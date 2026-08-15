import {
  createReadStream,
  existsSync,
  readFileSync,
} from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.join(__dirname, 'public')
const envPath = path.join(__dirname, '.env')

loadDotEnv(envPath)

const port = Number.parseInt(process.env.PORT || '3001', 10)
const difyBaseUrl = (process.env.DIFY_BASE_URL || '').replace(/\/$/, '')
const difyApiKey = process.env.DIFY_API_KEY || ''
const difySkipTlsVerify = process.env.DIFY_SKIP_TLS_VERIFY === 'true'
const difyTimeoutMs = Number.parseInt(process.env.DIFY_TIMEOUT_MS || '45000', 10)

if (difySkipTlsVerify)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      writeJson(res, 400, { error: 'Request URL is required.' })
      return
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    if (req.method === 'GET' && url.pathname === '/api/health') {
      writeJson(res, 200, {
        ok: true,
        hasDifyBaseUrl: Boolean(difyBaseUrl),
        hasDifyApiKey: Boolean(difyApiKey),
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      if (!difyBaseUrl || !difyApiKey) {
        writeJson(res, 500, {
          error: 'DIFY_BASE_URL and DIFY_API_KEY must be configured in .env.',
        })
        return
      }

      const body = await readJsonBody(req)
      const message = typeof body.message === 'string' ? body.message.trim() : ''

      if (!message) {
        writeJson(res, 400, { error: 'message is required.' })
        return
      }

      const abortController = new AbortController()
      let timeoutId = setTimeout(() => abortController.abort(), difyTimeoutMs)
      const refreshTimeout = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => abortController.abort(), difyTimeoutMs)
      }

      let response
      try {
        response = await postJson(`${difyBaseUrl}/chat-messages`, {
          headers: {
            Authorization: `Bearer ${difyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            inputs: body.inputs && typeof body.inputs === 'object' ? body.inputs : {},
            query: message,
            response_mode: 'streaming',
            user: typeof body.user === 'string' && body.user.trim() ? body.user : 'voice-chatbot-user',
            conversation_id: typeof body.conversationId === 'string' ? body.conversationId : '',
          },
          signal: abortController.signal,
          rejectUnauthorized: !difySkipTlsVerify,
          onChunk: refreshTimeout,
        })
      }
      finally {
        clearTimeout(timeoutId)
      }

      const rawText = response.text
      const payload = parseDifyResponse(rawText)

      if (response.statusCode < 200 || response.statusCode >= 300) {
        writeJson(res, response.statusCode, {
          error: payload?.message || payload?.error || 'Dify API request failed.',
          details: payload,
          rawText,
        })
        return
      }

      const answer = extractAnswer(payload)

      if (!answer) {
        writeJson(res, 502, {
          error: 'Dify returned success but no answer text was found.',
          details: payload,
          rawText,
        })
        return
      }

      writeJson(res, 200, {
        answer,
        conversationId: payload?.conversation_id || '',
        messageId: payload?.message_id || '',
        createdAt: payload?.created_at || null,
        metadata: payload?.metadata || null,
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/chat-stream') {
      if (!difyBaseUrl || !difyApiKey) {
        writeJson(res, 500, {
          error: 'DIFY_BASE_URL and DIFY_API_KEY must be configured in .env.',
        })
        return
      }

      const body = await readJsonBody(req)
      const message = typeof body.message === 'string' ? body.message.trim() : ''

      if (!message) {
        writeJson(res, 400, { error: 'message is required.' })
        return
      }

      const abortController = new AbortController()
      let timeoutId = setTimeout(() => abortController.abort(), difyTimeoutMs)
      const refreshTimeout = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => abortController.abort(), difyTimeoutMs)
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      })

      const streamRequest = createStreamingRequest(`${difyBaseUrl}/chat-messages`, {
        headers: {
          Authorization: `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          inputs: body.inputs && typeof body.inputs === 'object' ? body.inputs : {},
          query: message,
          response_mode: 'streaming',
          user: typeof body.user === 'string' && body.user.trim() ? body.user : 'voice-chatbot-user',
          conversation_id: typeof body.conversationId === 'string' ? body.conversationId : '',
        },
        signal: abortController.signal,
        rejectUnauthorized: !difySkipTlsVerify,
        onChunk: refreshTimeout,
        onEvent: (eventPayload) => {
          const normalized = normalizeStreamingEvent(eventPayload)
          if (!normalized)
            return

          writeSse(res, normalized.event, normalized.data)
        },
      })

      req.on('close', () => abortController.abort())

      try {
        await streamRequest
        writeSse(res, 'done', { ok: true })
      }
      catch (error) {
        writeSse(res, 'error', { message: formatServerError(error) })
      }
      finally {
        clearTimeout(timeoutId)
        res.end()
      }
      return
    }

    if (req.method === 'GET') {
      await serveStaticFile(url.pathname, res)
      return
    }

    writeJson(res, 404, { error: 'Not found.' })
  }
  catch (error) {
    writeJson(res, 500, {
      error: formatServerError(error),
    })
  }
})

server.listen(port, () => {
  console.log(`Voice chatbot server is running at http://localhost:${port}`)
})

function loadDotEnv(filePath) {
  if (!existsSync(filePath))
    return

  const content = readFileSyncSafe(filePath)
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#'))
      continue
    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 0)
      continue
    const key = line.slice(0, separatorIndex).trim()
    const value = normalizeEnvValue(line.slice(separatorIndex + 1).trim())
    if (!process.env[key])
      process.env[key] = value
  }
}

function readFileSyncSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  }
  catch {
    return ''
  }
}

function normalizeEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))
    return value.slice(1, -1)

  const commentIndex = value.indexOf(' #')
  if (commentIndex >= 0)
    return value.slice(0, commentIndex).trim()

  return value
}

async function serveStaticFile(requestPath, res) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath
  const safePath = path.normalize(normalizedPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join(publicDir, safePath)

  try {
    await access(filePath)
    res.writeHead(200, { 'Content-Type': getContentType(filePath) })
    createReadStream(filePath).pipe(res)
  }
  catch {
    const indexPath = path.join(publicDir, 'index.html')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    createReadStream(indexPath).pipe(res)
  }
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req)
    chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : {}
}

function writeJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function postJson(targetUrl, options) {
  const url = new URL(targetUrl)
  const bodyText = JSON.stringify(options.body)
  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: 'POST',
      headers: {
        ...options.headers,
        'Content-Length': Buffer.byteLength(bodyText),
      },
      rejectUnauthorized: options.rejectUnauthorized,
    }, (response) => {
      const chunks = []

      response.on('data', (chunk) => {
        chunks.push(chunk)
        options.onChunk?.()
      })
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode || 500,
          text: Buffer.concat(chunks).toString('utf8'),
        })
      })
      response.on('error', reject)
    })

    request.on('error', reject)

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        request.destroy(new Error('AbortError'))
      }, { once: true })
    }

    request.write(bodyText)
    request.end()
  })
}

function createStreamingRequest(targetUrl, options) {
  const url = new URL(targetUrl)
  const bodyText = JSON.stringify(options.body)
  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: 'POST',
      headers: {
        ...options.headers,
        'Content-Length': Buffer.byteLength(bodyText),
      },
      rejectUnauthorized: options.rejectUnauthorized,
    }, (response) => {
      if ((response.statusCode || 500) < 200 || (response.statusCode || 500) >= 300) {
        const chunks = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          const payload = parseDifyResponse(text)
          reject(new Error(payload?.message || payload?.error || `Dify API request failed with ${response.statusCode}`))
        })
        response.on('error', reject)
        return
      }

      let buffer = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        buffer += chunk
        options.onChunk?.()

        while (buffer.includes('\n\n')) {
          const separatorIndex = buffer.indexOf('\n\n')
          const block = buffer.slice(0, separatorIndex)
          buffer = buffer.slice(separatorIndex + 2)
          const payload = parseSseBlock(block)
          if (payload)
            options.onEvent?.(payload)
        }
      })
      response.on('end', () => resolve())
      response.on('error', reject)
    })

    request.on('error', reject)

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        request.destroy(new Error('AbortError'))
      }, { once: true })
    }

    request.write(bodyText)
    request.end()
  })
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  }
  catch {
    return null
  }
}

function parseDifyResponse(text) {
  const jsonPayload = safeJsonParse(text)
  if (jsonPayload)
    return jsonPayload

  return parseSsePayload(text)
}

function parseSsePayload(text) {
  const result = {
    answer: '',
    conversation_id: '',
    message_id: '',
    created_at: null,
    metadata: null,
    error: '',
    message: '',
  }

  const blocks = text.split('\n\n')
  for (const block of blocks) {
    const dataLines = block
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())

    if (!dataLines.length)
      continue

    const dataText = dataLines.join('\n')
    if (dataText === '[DONE]')
      continue

    const payload = safeJsonParse(dataText)
    if (!payload || typeof payload !== 'object')
      continue

    if (typeof payload.answer === 'string')
      result.answer += payload.answer
    if (typeof payload.conversation_id === 'string' && payload.conversation_id)
      result.conversation_id = payload.conversation_id
    if (typeof payload.message_id === 'string' && payload.message_id)
      result.message_id = payload.message_id
    if (payload.created_at)
      result.created_at = payload.created_at
    if (payload.metadata)
      result.metadata = payload.metadata
    if (typeof payload.error === 'string')
      result.error = payload.error
    if (typeof payload.message === 'string')
      result.message = payload.message
  }

  return result
}

function parseSseBlock(block) {
  const dataLines = block
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trim())

  if (!dataLines.length)
    return null

  const dataText = dataLines.join('\n')
  if (!dataText || dataText === '[DONE]')
    return null

  return safeJsonParse(dataText)
}

function normalizeStreamingEvent(payload) {
  if (!payload || typeof payload !== 'object')
    return null

  if (payload.event === 'error')
    return { event: 'error', data: { message: payload.message || payload.error || 'Dify stream error.' } }

  if (payload.event === 'message' || payload.event === 'agent_message') {
    return {
      event: 'delta',
      data: {
        text: typeof payload.answer === 'string' ? payload.answer : '',
        conversationId: payload.conversation_id || '',
        messageId: payload.message_id || '',
        createdAt: payload.created_at || null,
      },
    }
  }

  if (payload.event === 'message_end') {
    return {
      event: 'meta',
      data: {
        conversationId: payload.conversation_id || '',
        messageId: payload.message_id || '',
        metadata: payload.metadata || null,
      },
    }
  }

  return null
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function extractAnswer(payload) {
  if (!payload || typeof payload !== 'object')
    return ''

  const candidates = [
    payload.answer,
    payload.data?.answer,
    payload.output,
    payload.outputs?.text,
    payload.data?.outputs?.text,
    payload.data?.text,
    payload.text,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim())
      return value
  }

  return ''
}

function formatServerError(error) {
  if (!(error instanceof Error))
    return 'Unexpected server error.'

  if (error.name === 'AbortError' || error.message === 'AbortError')
    return `Dify response timed out after ${difyTimeoutMs}ms`

  const causeCode = error.cause && typeof error.cause === 'object' && 'code' in error.cause
    ? error.cause.code
    : ''

  if (causeCode)
    return `${error.message} (${causeCode})`

  return error.message
}

function getContentType(filePath) {
  const ext = path.extname(filePath)
  switch (ext) {
    case '.css':
      return 'text/css; charset=utf-8'
    case '.js':
      return 'application/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'text/html; charset=utf-8'
  }
}
