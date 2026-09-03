const http = require('http');

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<h1>Hello World from Node.js</h1>');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Node.js app listening on port 3000');
});