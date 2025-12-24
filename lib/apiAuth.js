/**
 * API Authentication Middleware
 * Validates API key for external API endpoints
 */

export function validateApiKey(request) {
    // Support both VIDEO_ARCHIVING_API_KEY and EXTERNAL_API_KEY
    const expectedKey = process.env.VIDEO_ARCHIVING_API_KEY || process.env.EXTERNAL_API_KEY;
    
    // In development mode, allow localhost requests without API key
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
        const host = request.headers.get('host') || '';
        const referer = request.headers.get('referer') || '';
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || 
                           referer.includes('localhost') || referer.includes('127.0.0.1');
        
        if (isLocalhost) {
            // Allow localhost requests in development
            return { valid: true };
        }
    }
    
    if (!expectedKey) {
        console.error('VIDEO_ARCHIVING_API_KEY or EXTERNAL_API_KEY not configured in environment variables');
        return { valid: false, error: 'API key not configured' };
    }
    
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
        return { valid: false, error: 'Unauthorized - API key required. Provide X-API-Key header.' };
    }
    
    if (apiKey !== expectedKey) {
        return { valid: false, error: 'Unauthorized - Invalid API key' };
    }
    
    return { valid: true };
}

/**
 * Rate limiting storage (in-memory, simple implementation)
 * For production, consider using Redis or a proper rate limiting library
 */
const rateLimitStore = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    
    const current = rateLimitStore.get(key) || 0;
    
    if (current >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: (Math.floor(now / windowMs) + 1) * windowMs };
    }
    
    rateLimitStore.set(key, current + 1);
    
    // Clean up old entries (every 10 minutes)
    if (Math.random() < 0.01) {
        const cutoff = now - (10 * 60 * 1000);
        for (const [k] of rateLimitStore) {
            const timestamp = parseInt(k.split('_')[1]) * windowMs;
            if (timestamp < cutoff) {
                rateLimitStore.delete(k);
            }
        }
    }
    
    return { allowed: true, remaining: maxRequests - current - 1, resetAt: (Math.floor(now / windowMs) + 1) * windowMs };
}

