const { test, expect } = require('@playwright/test');

test.describe('security.txt (RFC 9116)', () => {
  test('is served with a Contact and a non-expired Expires field', async ({ request }) => {
    const res = await request.get('/.well-known/security.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();

    expect(body).toMatch(/^Contact:\s*(https:\/\/|mailto:)\S+/m);
    expect(body).toMatch(/^Canonical:\s*https:\/\/kakarla\.in\/\.well-known\/security\.txt/m);

    const expires = body.match(/^Expires:\s*(\S+)/m);
    expect(expires, 'Expires field is required').not.toBeNull();
    const expiresAt = new Date(expires[1]).getTime();
    expect(Number.isNaN(expiresAt)).toBe(false);
    // Fails when the file is within 30 days of expiry, so it gets renewed in time.
    expect(expiresAt - Date.now()).toBeGreaterThan(30 * 24 * 60 * 60 * 1000);
  });

  test('does not expose an email address', async ({ request }) => {
    const body = await (await request.get('/.well-known/security.txt')).text();
    expect(body).not.toMatch(/mailto:|@kakarla\.in/i);
  });
});
