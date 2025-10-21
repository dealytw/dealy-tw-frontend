import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  const { tag, secret } = await req.json();
  if (secret !== process.env.REVALIDATE_SECRET) return new Response('forbidden', { status: 403 });
  revalidateTag(tag);
  return new Response('ok');
}