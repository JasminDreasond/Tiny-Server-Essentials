import TinyWeb from '../../dist/index.mjs';

const startExpressServer = () => {
  const http = new TinyWeb.Express();
  http.init();
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

  http.installErrors({
    errNext: (status, err, req, res) => http.sendHttpError(res, status),
  });

  http.getServer().listen(3050, () => {
    console.log('Server is up on port 3050');
  });
};

export default startExpressServer;
