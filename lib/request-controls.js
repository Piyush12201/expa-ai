const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;
const CACHE_TTL_MS = 10 * 60 * 1000;

const rateLimitStore = new Map();
const analysisCache = new Map();

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "local";
}

export function checkRateLimit(ip) {
  const now = Date.now();
  const item = rateLimitStore.get(ip);

  if (!item || now - item.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (item.count >= MAX_REQUESTS_PER_WINDOW) {
    const remaining = Math.ceil((WINDOW_MS - (now - item.windowStart)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, remaining) };
  }

  item.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function buildAnalysisCacheKey(idea, location) {
  return `${String(idea || "").trim().toLowerCase()}::${String(location || "").trim().toLowerCase()}`;
}

export function getCachedAnalysis(key) {
  const item = analysisCache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() > item.expiresAt) {
    analysisCache.delete(key);
    return null;
  }

  return item.value;
}

export function setCachedAnalysis(key, value) {
  analysisCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
