# Security headers via Cloudflare

GitHub Pages cannot set custom response headers, and a `_headers` file is
ignored there. Because kakarla.in is proxied by Cloudflare, set these with
**Rules → Transform Rules → Modify Response Header** (apply to hostname
`kakarla.in`). Verify afterwards at <https://securityheaders.com> and
<https://hstspreload.org>.

| Header                                | Value                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Strict-Transport-Security`           | `max-age=31536000; includeSubDomains` (add `; preload` only after checking every subdomain is HTTPS) |
| `X-Content-Type-Options`              | `nosniff`                                                                                            |
| `Referrer-Policy`                     | `strict-origin-when-cross-origin`                                                                    |
| `Permissions-Policy`                  | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`                   |
| `Cross-Origin-Opener-Policy`          | `same-origin`                                                                                        |
| `Content-Security-Policy-Report-Only` | see below                                                                                            |

Cloudflare's own **SSL/TLS → Edge Certificates → HSTS** toggle can set HSTS
instead of a rule.

## CSP: start in report-only

The page has two inline scripts (theme bootstrap, GTM loader) plus JSON-LD,
and loads Google Tag Manager. Start with report-only so nothing breaks, review
the browser console for violations, then switch to `Content-Security-Policy`.

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com;
img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline';
font-src 'self';
manifest-src 'self';
worker-src 'self';
base-uri 'self';
form-action 'self';
object-src 'none';
frame-ancestors 'self'
```

To drop `'unsafe-inline'` from `script-src`, replace it with the SHA-256 hashes
of the two inline scripts (the browser console prints the hash when it blocks
one), or move them to external files.

Note: this could not be verified against the live site from the build
environment; check the response headers on kakarla.in after applying.
