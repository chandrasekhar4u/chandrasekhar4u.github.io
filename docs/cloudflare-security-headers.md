# Security headers via Cloudflare

GitHub Pages cannot set custom response headers (a `_headers` file is ignored).
The page therefore ships its Content Security Policy in a
`<meta http-equiv="Content-Security-Policy">` tag, which browsers enforce.
A `<meta>` policy cannot carry everything, so the headers below should be added
in Cloudflare (kakarla.in is proxied by Cloudflare):
**Rules → Transform Rules → Modify Response Header**, hostname `kakarla.in`.
Verify afterwards at <https://securityheaders.com>.

## What the `<meta>` CSP already enforces

Hash-based strict CSP (CSP Level 3), as recommended by web.dev and by Google's
Tag Manager CSP guide (updated 2026-11-10):

- Scripts run only if they are one of the three hashed inline scripts (theme
  bootstrap, GTM loader, `main.js` loader) or are inserted by one of them
  (`'strict-dynamic'`). No `'unsafe-eval'`, no host allowlist for scripts.
  `'unsafe-inline' https:` are fallbacks for very old browsers only; browsers
  that understand hashes or `'strict-dynamic'` ignore them.
- Styles, fonts, manifest, service worker: same origin only. No inline styles.
- Images and beacons: same origin plus the Google Tag Manager / Google
  Analytics 4 endpoints from Google's guide, and `*.clarity.ms` (plus
  `c.bing.com`, which Clarity's `c.gif` redirects to) for the Microsoft Clarity tag that the GTM container (GTM-N7SV3CF) loads. If a tag is
  added to the container that sends data to another host, add that host to
  `img-src` / `connect-src` here and in `index.html`; the CI test
  `tests/csp.spec.js` loads the real container and fails on any violation.
- `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`.

`tests/csp.spec.js` fails if an inline script changes without its hash being
updated (the failure message prints the new hash), or if any violation fires.

## Headers to add in Cloudflare

| Header                       | Value                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`    | the policy below (same as the `<meta>`, plus `frame-ancestors`)                                          |
| `X-Frame-Options`            | `DENY` (legacy browsers; `frame-ancestors` supersedes it)                                                |
| `Strict-Transport-Security`  | `max-age=31536000; includeSubDomains` (add `; preload` only after checking every subdomain serves HTTPS) |
| `X-Content-Type-Options`     | `nosniff`                                                                                                |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                                                        |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`                       |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                                                            |

Header-only directives the `<meta>` cannot use: `frame-ancestors` (stops other
sites framing the page), `report-to` / `report-uri`, `sandbox`, and the
`Content-Security-Policy-Report-Only` header.

```
default-src 'self';
script-src 'sha256-IL7ZFoYSQj1gDWQ9FaUnZD88IhTrPCnIfN4C3G/H3Zg=' 'sha256-dhT/tAtX6Pcb5ZfSwtz8RRqmPtBPMKS2v4nLHMd3Yo4=' 'sha256-1OemphecNqRA+y9f4R6750xH/Pi1JKuEbncorSpIe6k=' 'strict-dynamic' 'unsafe-inline' https:;
style-src 'self';
img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com https://*.g.doubleclick.net https://*.clarity.ms https://c.bing.com;
connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://*.g.doubleclick.net https://*.clarity.ms;
font-src 'self';
manifest-src 'self';
worker-src 'self';
frame-src https://www.googletagmanager.com;
object-src 'none';
base-uri 'none';
form-action 'none';
frame-ancestors 'none'
```

When both the header and the `<meta>` are present, the browser enforces both,
so keep the two `script-src` lists identical. If an inline script in
`index.html` changes, update the hash in both places.

## Cloudflare features that inject scripts

These insert scripts into the HTML at the edge, which the strict policy blocks
(the page still works; only that feature stops):

- **Rocket Loader**: keep it off; it rewrites script tags.
- **Web Analytics** automatic setup (`static.cloudflareinsights.com`): disabled
  or replaced by GA4.
- **Bot Fight Mode / JavaScript detections** (`/cdn-cgi/challenge-platform/`).

After deploying, open kakarla.in with DevTools → Console and check for
"Refused to …" messages; none are expected.

## Not adopted

- `require-trusted-types-for 'script'`: Google Tag Manager is not compatible
  with Trusted Types enforcement.
- `upgrade-insecure-requests`: the page has no `http://` URLs.
