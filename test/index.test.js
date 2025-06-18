import assert from 'node:assert/strict';
import test from 'node:test';

process.env.ACCESS_KEY_ID = 'x';
process.env.SECRET_ACCESS_KEY = 'x';
process.env.SPACES_ENDPOINT = 'https://example.com';
process.env.REGION = 'us-east-1';
process.env.API_KEY = 'testkey';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../index.js');

test('trust proxy is enabled', () => {
  assert.equal(app.get('trust proxy'), true);
});

test('POST /presign requires API key and key', async () => {
  const server = app.listen(0);
  const url = `http://127.0.0.1:${server.address().port}`;

  let res = await fetch(`${url}/presign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 401);

  res = await fetch(`${url}/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'testkey'
    },
    body: '{}'
  });
  assert.equal(res.status, 400);
  server.close();
});
