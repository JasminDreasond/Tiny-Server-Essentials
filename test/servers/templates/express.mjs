import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import TinyExpress from '../../../dist/Express.mjs';

/**
 * @param {import('express').Application} app
 * @param {TinyExpress} http
 */
const insertExpress = (app, http) => {
  app.use(cookieParser());
  app.use(bodyParser.json());

  app.get('/', (req, res) => {
    console.log(req.ips, req.ip, req.socket?.remoteAddress);
    console.log(http.extractIp(req));
    console.log(http.getOrigin(req));
    console.log(req.cookies);
    console.log(req.get('User-Agent'));

    console.log(req.body);

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
};

export default insertExpress;
