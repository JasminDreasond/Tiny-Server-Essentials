import TinyWeb from '../../dist/index.mjs';
import insertSocket from './templates/socket.mjs';

const startSocketServer = () => {
  // Start Socket Io
  const webSocket = new TinyWeb.Io();
  webSocket.init();

  // Start socket io
  insertSocket(webSocket);

  // Start server
  webSocket.getRoot().listen(3050);
  console.log('Server is up on port 3050');
};

export default startSocketServer;
