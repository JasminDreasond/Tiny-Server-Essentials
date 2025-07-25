import cookie from 'cookie';
import TinyIo from '../../../dist/TinyIo.mjs';

/**
 * @param {TinyIo} webSocket
 */
const insertSocket = (webSocket) => {
  const io = webSocket.getRoot();

  io.on('connection', (socket) => {
    const rawCookies = socket.handshake.headers.cookie;
    const cookies = typeof rawCookies === 'string' ? cookie.parse(rawCookies) : '';
    const userAgent = socket.handshake.headers['user-agent'];

    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const rawAddress = socket.handshake.address;
    const remoteAddress = socket.request.socket.remoteAddress;

    console.log(socket.id);
    console.log(forwarded, rawAddress, remoteAddress);
    console.log(webSocket.extractIp(socket));
    console.log(webSocket.getOrigin(socket));
    console.log(cookies);
    console.log(userAgent);

    socket.on('mic', (data, metadata) => {
      // data = Blob
      io.emit('mic', data, { ...metadata, userId: socket.id });
    });

    socket.on('cam', (data, metadata) => {
      // data = Blob
      io.emit('cam', data, { ...metadata, userId: socket.id });
    });

    socket.on('screen', (data, metadata) => {
      // data = Blob
      io.emit('screen', data, { ...metadata, userId: socket.id });
    });

    // console.log(req.get('User-Agent'));
  });
};

export default insertSocket;
