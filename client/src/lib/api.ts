import type { ApiEnvelope } from '../types/api'
import { auth } from './firebase'

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  query?: Query
  body?: unknown
  form?: FormData
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function send(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.form) body = opts.form // the browser sets the multipart boundary itself
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  try {
    return await fetch(buildUrl(path, opts.query), { method: opts.method ?? 'GET', headers, body, signal: opts.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.')
  }
}

/** Sends the Firebase ID token when someone is signed in; retries once with a fresh token if it was rejected. */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const user = auth.currentUser
  let res = await send(path, opts, user ? await user.getIdToken() : null)

  if (res.status === 401 && user) {
    const peek = (await res.clone().json().catch(() => null)) as { error?: { code?: string } } | null
    if (peek?.error?.code === 'INVALID_TOKEN') res = await send(path, opts, await user.getIdToken(true))
  }

  const json = (await res.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { error?: { code?: string; message?: string; details?: unknown } }
    | null

  if (!res.ok) {
    const err = json && 'error' in json ? json.error : undefined
    throw new ApiError(res.status, err?.code ?? 'HTTP_ERROR', err?.message ?? res.statusText, err?.details)
  }
  return json as ApiEnvelope<T>
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ?? {} }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
  upload: <T>(path: string, file: File, query?: Query) => {
    const form = new FormData()
    form.append('file', file)
    return request<T>(path, { method: 'POST', form, query })
  },
}

/** Human-friendly message for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
