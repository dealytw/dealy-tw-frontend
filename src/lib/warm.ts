import { setTimeout as sleep } from 'node:timers/promises'

type WarmOpts = {
  origin?: string
  concurrency?: number
  timeoutMs?: number
  retries?: number
  headers?: Record<string, string>
}

function absoluteUrl(origin: string, path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${origin}${clean}`
}

async function warmOnce(url: string, timeoutMs: number, headers: HeadersInit) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual',
      cache: 'no-store',
      signal: ctrl.signal,
    })
    if (res.status >= 200 && res.status < 400) return true
    return false
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}

async function warmWithRetry(url: string, retries: number, timeoutMs: number, headers: HeadersInit) {
  for (let i = 0; i <= retries; i++) {
    const ok = await warmOnce(url, timeoutMs, headers)
    if (ok) return true
    await sleep(200 * (i + 1))
  }
  return false
}

export async function warmPaths(paths: string[], opts: WarmOpts = {}) {
  if (!paths?.length) return { ok: true, warmed: [] as string[], failed: [] as string[] }

  const origin = opts.origin ?? process.env.PUBLIC_SITE_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  if (!origin?.startsWith('http')) {
    throw new Error('Missing PUBLIC_SITE_ORIGIN (e.g. https://dealy.tw)')
  }

  const concurrency = opts.concurrency ?? 3
  const timeoutMs = opts.timeoutMs ?? 4000
  const retries = opts.retries ?? 2

  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Encoding': 'gzip, br',
    ...(opts.headers || {}),
  }

  const urls = [...new Set(paths)]
    .filter(p => p && p.startsWith('/'))
    .filter(p => !p.startsWith('/admin') && !p.startsWith('/preview'))
    .map(p => absoluteUrl(origin, p))

  const warmed: string[] = []
  const failed: string[] = []

  let i = 0
  async function worker() {
    while (i < urls.length) {
      const idx = i++
      const u = urls[idx]
      const ok = await warmWithRetry(u, retries, timeoutMs, headers)
      ;(ok ? warmed : failed).push(u)
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker())
  await Promise.all(workers)

  return { ok: failed.length === 0, warmed, failed }
}


