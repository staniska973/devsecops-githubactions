const { sanitizeInput } = require('../src/app');

describe('Tests sécurité simples (OWASP)', () => {
  test('Neutralise une tentative XSS', () => {
    const payload = '<script>alert(1)</script>';
    const result = sanitizeInput(payload);

    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('Neutralise les guillemets pour limiter les injections', () => {
    const payload = "' OR '1'='1\"";
    const result = sanitizeInput(payload);

    expect(result).toContain('&#39;');
    expect(result).toContain('&quot;');
  });
});
