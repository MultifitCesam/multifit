import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Buckets that are now private and require signed URLs.
const PRIVATE_BUCKETS = new Set(["avatars", "community-media"]);
const SIGN_TTL = 60 * 60; // 1 hour

type Entry = { url: string; expires: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<string>>();

/** Extract { bucket, key } from a Supabase storage URL if it points at one of our private buckets. */
function parseStorageUrl(input: string): { bucket: string; key: string } | null {
  if (!input) return null;
  // Match /storage/v1/object/(public|authenticated|sign)/{bucket}/{key}
  const m = input.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (m && PRIVATE_BUCKETS.has(m[1])) return { bucket: m[1], key: decodeURIComponent(m[2]) };
  return null;
}

async function signOne(bucket: string, key: string): Promise<string> {
  const cacheKey = `${bucket}/${key}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now + 60_000) return hit.url;
  const pending = inflight.get(cacheKey);
  if (pending) return pending;

  const p = (async () => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, SIGN_TTL);
    if (error || !data?.signedUrl) throw error ?? new Error("sign failed");
    cache.set(cacheKey, { url: data.signedUrl, expires: now + SIGN_TTL * 1000 });
    inflight.delete(cacheKey);
    return data.signedUrl;
  })();
  inflight.set(cacheKey, p);
  return p;
}

/** Resolve a stored media reference to a URL usable in <img>/<video>. Passes through external URLs. */
export async function resolveMediaUrl(input: string | null | undefined): Promise<string | null> {
  if (!input) return null;
  const parsed = parseStorageUrl(input);
  if (!parsed) return input;
  try {
    return await signOne(parsed.bucket, parsed.key);
  } catch {
    return null;
  }
}

/** React hook: returns the display URL for a stored media reference (or null while loading). */
export function useSignedMedia(input: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!input) return null;
    const parsed = parseStorageUrl(input);
    if (!parsed) return input;
    const hit = cache.get(`${parsed.bucket}/${parsed.key}`);
    return hit && hit.expires > Date.now() + 60_000 ? hit.url : null;
  });

  useEffect(() => {
    let alive = true;
    if (!input) { setUrl(null); return; }
    const parsed = parseStorageUrl(input);
    if (!parsed) { setUrl(input); return; }
    signOne(parsed.bucket, parsed.key)
      .then(u => { if (alive) setUrl(u); })
      .catch(() => { if (alive) setUrl(null); });
    return () => { alive = false; };
  }, [input]);

  return url;
}
