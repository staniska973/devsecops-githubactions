const express = require('express');
const helmet = require('helmet');

const app = express();
app.use(express.json());
app.use(helmet());
app.disable('x-powered-by');

function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
}

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/echo', (req, res) => {
  const message = sanitizeInput(req.body.message || '');
  res.status(200).json({ message });
});

module.exports = { app, sanitizeInput };
