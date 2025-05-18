import TinyIo from '../../../dist/Io.mjs';
import TinyWeb from '../../../dist/index.mjs';

const { extractIpList } = TinyWeb.Utils;

/**
 * @param {TinyIo} webSocket
 */
const insertSocket = (webSocket) => {
  const io = webSocket.getRoot();

  io.on('connection', (socket) => {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const rawAddress = socket.handshake.address;
    const remoteAddress = socket.request.socket.remoteAddress;

    console.log(socket.id);
    console.log(forwarded, rawAddress, remoteAddress);
    console.log(webSocket.extractIp(socket));
    console.log(webSocket.getOrigin(socket));

    // console.log(req.get('User-Agent'));
  });
};

export default insertSocket;
