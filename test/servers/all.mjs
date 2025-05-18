import { createServer } from 'http';
import TinyWeb from '../../dist/index.mjs';
import insertExpress from './templates/express.mjs';
import insertSocket from './templates/socket.mjs';

const startAllServer = () => {
  // Start Express
  const http = new TinyWeb.Express();
  http.init(createServer(http.getRoot()));
  const main = http.getServer();

  // Start Socket Io
  const webSocket = new TinyWeb.Io(main, { cors: { origin: '*' } });

  webSocket.init(http.getWeb());

  // Insert Express router
  const app = http.getRoot();

  // Start express
  insertExpress(app, http);

  // Start socket io
  insertSocket(webSocket);

  // Start server
  main.listen(3050, () => {
    console.log('Server is up on port 3050');
  });
};

export default startAllServer;
