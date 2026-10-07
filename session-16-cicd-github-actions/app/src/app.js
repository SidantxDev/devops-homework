const http = require('http');

const VERSION = process.env.APP_VERSION || 'dev';

// Pure functions are exported so unit tests can call them without a server
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('add() expects two numbers');
  }
  return a + b;
}

function greet(name) {
  const clean = String(name || '').trim();
  return clean ? `Hello, ${clean}!` : 'Hello, DevOps!';
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/') {
      return sendJson(res, 200, { message: greet(url.searchParams.get('name')), version: VERSION });
    }
    if (url.pathname === '/health') {
      return sendJson(res, 200, { status: 'ok' });
    }
    if (url.pathname === '/add') {
      const a = Number(url.searchParams.get('a'));
      const b = Number(url.searchParams.get('b'));
      if (Number.isNaN(a) || Number.isNaN(b)) {
        return sendJson(res, 400, { error: 'a and b must be numbers' });
      }
      return sendJson(res, 200, { result: add(a, b) });
    }
    return sendJson(res, 404, { error: 'not found' });
  });
}

module.exports = { add, greet, createServer, VERSION };
