const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.txt':'text/plain'};
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(__dirname, rel);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(8777, () => console.log('ready'));
