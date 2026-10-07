const http = require('http');

http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Hello World from Docker multi-stage build\n');
}).listen(8080, '0.0.0.0', () => console.log('Listening on port 8080'));