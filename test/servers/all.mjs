import { createServer } from 'http';
import TinyWeb from '../../dist/index.mjs';

const startAllServer = () => {
  // Start Express
  const http = new TinyWeb.Express();
  http.init(createServer(http.getRoot()));
  const main = http.getServer();

  // Start Socket Io
  const webSocket = new TinyWeb.Io(main);
  webSocket.init(http.getWeb());

  // Insert Express router
  const app = http.getRoot();

  app.get('/', (req, res) => {
    console.log(req.ips, req.ip, req.socket?.remoteAddress);
    console.log(req.get('User-Agent'));
    console.log(http.extractIp(req));
    res.send('<h1>Home page</h1>');
  });

  app.get('/products', (req, res) => {
    res.send('<h1>Products page</h1>');
  });

  app.get('/crash', (req, res) => {
    res.send(yay);
  });

  // Install express errors
  http.installErrors({
    errNext: (status, err, req, res) => http.sendHttpError(res, status),
  });

  // Start server
  main.listen(3050, () => {
    console.log('Server is up on port 3050');
  });
};

export default startAllServer;
