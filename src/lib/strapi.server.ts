// src/lib/strapi.server.ts - Server-only Strapi fetch wrapper
// Note: This file should only be imported in server components

import 'server-only';

type NextInit = RequestInit & { revalidate?: number; tag?: string };

export async function strapiFetch<T>(path: string, init?: NextInit) {
  const baseUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) {
    throw new Error('STRAPI_URL or NEXT_PUBLIC_STRAPI_URL environment variable is required');
  }
  
  const url = `${baseUrl}${path}`;
  const { revalidate, tag, ...rest } = init || {};
  
  console.log('strapiFetch: Making request to', url);
  
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(rest?.headers || {}),
      Authorization: `Bearer ${process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN}`,
    },
    next: revalidate ? { revalidate, tags: tag ? [tag] : [] } : undefined,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strapi ${res.status}: ${url}\n${text.slice(0, 600)}`);
  }
  
  return (await res.json()) as T;
}

// Helper function to build query strings
export function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { 
    if (v !== undefined && v !== null) sp.set(k, String(v)); 
  });
  return sp.toString();
}

// Helper function to absolutize media URLs
export function absolutizeMedia(u?: string | null) {
  if (!u) return "";
  const base = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "";
  return u.startsWith("http") ? u : `${base}${u}`;
}
