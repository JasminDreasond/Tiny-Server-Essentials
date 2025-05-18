import TinyIo from '../../../dist/Io.mjs';
import TinyWeb from '../../../dist/index.mjs';

const { extractIpList } = TinyWeb.Utils;

/**
 * @param {TinyIo} webSocket
 */
const insertSocket = (webSocket) => {
  const io = webSocket.getRoot();

  io.on('connection', (socket) => {
    console.log(socket.id);

    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const rawAddress = socket.handshake.address;
    const ipList = extractIpList(forwarded || rawAddress);
    console.log('Client IPs:', ipList);
  });
};

export default insertSocket;
