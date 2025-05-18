import TinyIo from '../../../dist/Io.mjs';

/**
 * @param {TinyIo} webSocket
 */
const insertSocket = (webSocket) => {
  const io = webSocket.getRoot();

  io.on('connection', (socket) => {
    console.log(socket.id);
  });
};

export default insertSocket;
