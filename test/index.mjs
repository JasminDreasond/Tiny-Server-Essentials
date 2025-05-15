import TinyExpress from '../dist/index.mjs';

const server = new TinyExpress();

server.app.get('/', (req, res) => {
  res.send('<h1>Home page</h1>');
});

server.app.get('/products', (req, res) => {
  res.send('<h1>Products page</h1>');
});

server.installErrors();

server.app.listen(3050, () => {
  console.log('Server is up on port 3050');
});
