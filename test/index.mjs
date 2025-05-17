import TinyWeb from '../dist/index.mjs';

const server = new TinyWeb.Express();

server.app.get('/', (req, res) => {
  console.log(req.ips, req.ip, req.socket?.remoteAddress);
  console.log(server.extractIp(req));
  res.send('<h1>Home page</h1>');
});

server.app.get('/products', (req, res) => {
  res.send('<h1>Products page</h1>');
});

server.app.get('/crash', (req, res) => {
  res.send(yay);
});

server.installErrors({
  errNext: (status, err, req, res) => server.sendHttpError(res, status),
});

server.app.listen(3050, () => {
  console.log('Server is up on port 3050');
});
