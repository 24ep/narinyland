import { Request, Response, NextFunction } from 'express';
import dns from 'dns';
import { promisify } from 'util';

const reverse = promisify(dns.reverse);
const resolve4 = promisify(dns.resolve4);

/**
 * List of bot signatures to block by default.
 * These are typically high-traffic or undesirable scrapers.
 */
const UNDESIRABLE_BOTS = [
  'ahrefsbot',
  'mj12bot',
  'semrushbot',
  'dotbot',
  'rogerbot',
  'exabot',
  'grapeshot',
  'petalbot',
  'gptbot',
  'chatgpt-user',
  'ccbot',
  'claudebot',
  'piplbot',
  'web-crawlers',
  'python-requests',
  'curl',
  'node-fetch',
  'axios',
  'scrapy',
];

/**
 * Verify if a request claiming to be Googlebot actually comes from Google IPs.
 * Google recommends reverse DNS lookup for this.
 */
async function verifyGooglebot(ip: string): Promise<boolean> {
  try {
    // Reverse DNS to get hostname
    const hostnames = await reverse(ip);
    if (!hostnames || hostnames.length === 0) return false;

    const hostname = hostnames[0];
    // Check if hostname ends with .googlebot.com or .google.com
    if (!(hostname.endsWith('.googlebot.com') || hostname.endsWith('.google.com'))) {
      return false;
    }

    // Forward DNS to verify IP matches original IP
    const resolvedIps = await resolve4(hostname);
    return resolvedIps.includes(ip);
  } catch (error) {
    // If DNS check fails, we might be offline or DNS is blocked. 
    // In many production environments, we trust Googlebot UA if DNS is slow,
    // but for "antibot" we should be stricter.
    return false;
  }
}

/**
 * AntiBot Middleware
 * 
 * Protects the site from unwanted scrapers while ensuring legitimate 
 * search engine crawlers (like Google) can still index the site.
 */
export const antibotMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  
  // Get IP (considering potential proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '');

  // 1. Check for Legitimate Search Engines (Allow List)
  if (ua.includes('googlebot')) {
    // In a high-performance scenario, you might only verify periodically 
    // or trust the header if the risk is low.
    // However, to be a true "AntiBot", we verify the source.
    const isVerified = await verifyGooglebot(ip);
    if (isVerified) {
      // console.log(`[AntiBot] Verified Googlebot allowed: ${ip}`);
      return next();
    } else {
      console.warn(`[AntiBot] Spoofed Googlebot detected and blocked: ${ip} (UA: ${req.headers['user-agent']})`);
      return res.status(403).json({ error: 'Access denied: Unverified crawler' });
    }
  }

  // Allow other major search engines if desired (Bing, DuckDuckGo)
  if (ua.includes('bingbot') || ua.includes('duckduckbot') || ua.includes('baiduspider')) {
    return next();
  }

  // 2. Block Undesirable Bots (Deny List)
  if (UNDESIRABLE_BOTS.some(bot => ua.includes(bot))) {
    console.log(`[AntiBot] Blocked undesirable bot: ${ua} from ${ip}`);
    return res.status(403).json({ 
      error: 'Direct bot access is prohibited.',
      message: 'If you are a human, please use a standard web browser.' 
    });
  }

  // 3. Optional: Block requests with no User-Agent
  if (!ua || ua.length < 10) {
    return res.status(403).json({ error: 'Invalid User-Agent' });
  }

  // Pass through for humans and everything else
  next();
};
